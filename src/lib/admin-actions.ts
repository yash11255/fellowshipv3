"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "./admin";
import { CATALOG_TAG } from "./catalog";
import { SETTINGS_TAG } from "./settings";
import { DEFAULT_SETTINGS } from "./pricing";
import { encrypt } from "./secrets";
import { SECRET_FIELDS } from "./integrations";
import { testRazorpay } from "./razorpay";
import { createShipment, ShippingError, testProvider, type ProviderId } from "./shipping";
import { sendEmail } from "./email";
import { normCode } from "./discounts";
import { orderToken } from "./auth";

const Status = z.enum(["pending_payment", "confirmed", "paid", "shipped", "delivered", "cancelled", "refunded"]);

export async function setOrderStatus(number: string, status: string, note?: string) {
  await requireStaff("support");
  const s = Status.parse(status);
  const d = await db();
  await d.update(schema.orders).set({ status: s, ...(note !== undefined ? { notes: note.slice(0, 2000) } : {}) }).where(eq(schema.orders.number, number));
  revalidatePath(`/admin/orders/${number}`);
  revalidatePath("/admin/orders");
  return { ok: true };
}

const ProductInput = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(10_000),
  seoTitle: z.string().max(70, "SEO title: keep it under 70 characters").optional().default(""),
  seoDescription: z.string().max(170, "Meta description: keep it under 170 characters").optional().default(""),
  taxSlab: z.string().max(40),
  hsn: z.string().regex(/^(\d{4}|\d{6}|\d{8})?$/, "HSN code must be 4, 6 or 8 digits").optional().default(""),
  status: z.enum(["active", "draft", "archived"]),
  variants: z.array(z.object({
    id: z.number().int(),
    price: z.number().int().min(0).max(1_000_000),
    compareAt: z.number().int().min(0).max(1_000_000),
    available: z.boolean(),
    stock: z.number().int().min(0).max(1_000_000).nullable(),
    sku: z.string().max(64).nullable(),
  })),
});

export async function saveProduct(handle: string, raw: z.input<typeof ProductInput>) {
  await requireStaff("manager");
  const parsed = ProductInput.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  const p = parsed.data;
  const d = await db();
  await d.transaction(async (tx) => {
    await tx.update(schema.products).set({ title: p.title, description: p.description, status: p.status, seoTitle: p.seoTitle || null, seoDescription: p.seoDescription || null, taxSlab: p.taxSlab, hsn: p.hsn || null, updatedAt: new Date() }).where(eq(schema.products.handle, handle));
    for (const v of p.variants) {
      await tx.update(schema.variants).set({ price: v.price, compareAt: v.compareAt, available: v.available, stock: v.stock, sku: v.sku || null }).where(eq(schema.variants.id, v.id));
    }
  });
  updateTag(CATALOG_TAG); // storefront shows the change on the next request
  revalidatePath("/admin/products");
  return { ok: true as const };
}

// ── Store settings ──────────────────────────────────────────────
const StoreInput = z.object({
  freeShippingAt: z.number().int().min(0).max(100_000),
  shippingFee: z.number().int().min(0).max(5_000),
  codFee: z.number().int().min(0).max(5_000),
  codEnabled: z.boolean(),
  announcement: z.string().max(140),
});

async function upsert(key: string, value: unknown) {
  const d = await db();
  await d.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}

export async function saveStoreSettings(raw: z.input<typeof StoreInput>) {
  await requireStaff("owner");
  const p = StoreInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof typeof p.data)[]) await upsert(k, p.data[k]);
  updateTag(SETTINGS_TAG);
  return { ok: true as const };
}

const SeoInput = z.object({
  siteTitle: z.string().min(5).max(70), titleTemplate: z.string().max(70).refine((v) => v.includes("%s"), "Template must contain %s"),
  siteDescription: z.string().min(20).max(170), ogImage: z.string().max(300), siteUrl: z.string().url(),
  allowIndexing: z.boolean(), ga4Id: z.string().regex(/^(G-[A-Z0-9]+)?$/, "GA4 ID looks like G-XXXXXXX"),
  metaPixelId: z.string().regex(/^\d*$/, "Meta Pixel ID is numeric"), gscVerification: z.string().max(100),
  organizationName: z.string().max(80), instagram: z.string().max(200), youtube: z.string().max(200),
});

export async function saveSeo(raw: z.input<typeof SeoInput>) {
  await requireStaff("manager");
  const p = SeoInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  await upsert("seo", p.data);
  updateTag(SETTINGS_TAG);
  return { ok: true as const };
}

// ── Integrations (payments, couriers) ───────────────────────────
const INTEGRATIONS = ["razorpay", "shiprocket", "delhivery", "shipping"] as const;

export async function saveIntegration(name: (typeof INTEGRATIONS)[number], values: Record<string, string | boolean>) {
  await requireStaff("owner");
  if (!INTEGRATIONS.includes(name)) return { ok: false as const, error: "Unknown integration" };
  const d = await db();
  const [row] = await d.select().from(schema.settings).where(eq(schema.settings.key, `int:${name}`));
  const prev = (row?.value ?? {}) as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (typeof v === "string" && v.length > 500) return { ok: false as const, error: `${k} is too long` };
    if (SECRET_FIELDS.has(k)) next[k] = v === "__set__" ? prev[k] : v ? encrypt(String(v)) : ""; // keep, replace or clear
    else next[k] = typeof v === "string" ? v.trim() : v;
  }
  await upsert(`int:${name}`, next);
  return { ok: true as const };
}

export async function testIntegration(name: "razorpay" | "shiprocket" | "delhivery", draft?: { keyId?: string; keySecret?: string }) {
  await requireStaff("owner");
  if (name === "razorpay") {
    const { razorpayConfig } = await import("./integrations");
    const saved = await razorpayConfig();
    const keyId = draft?.keyId || saved?.keyId, keySecret = (draft?.keySecret && draft.keySecret !== "__set__" ? draft.keySecret : saved?.keySecret);
    if (!keyId || !keySecret) return { ok: false as const, error: "Enter a Key ID and Key Secret first." };
    return testRazorpay(keyId, keySecret);
  }
  return testProvider(name);
}

// ── Fulfilment ──────────────────────────────────────────────────
export async function shipOrder(number: string, provider: ProviderId, manual?: { carrier: string; trackingNumber: string; trackingUrl?: string }) {
  await requireStaff("support");
  const d = await db();
  const [o] = await d.select().from(schema.orders).where(eq(schema.orders.number, number)).limit(1);
  if (!o) return { ok: false as const, error: "Order not found" };
  if (!["confirmed", "paid"].includes(o.status)) return { ok: false as const, error: "Only confirmed or paid orders can be shipped." };
  const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
  try {
    const s = await createShipment(provider, o, items, manual);
    await d.update(schema.orders).set({ status: "shipped", carrier: s.carrier, trackingNumber: s.trackingNumber, trackingUrl: s.trackingUrl || null, shipmentRef: s.shipmentRef ?? null, shippedAt: new Date() })
      .where(and(eq(schema.orders.id, o.id)));
    const base = process.env.SITE_URL ?? "http://localhost:3100";
    await sendEmail({
      to: o.email, subject: `Your order ${o.number} has shipped`,
      text: `Good news, your order ${o.number} is on its way with ${s.carrier}.\nTracking number: ${s.trackingNumber}${s.trackingUrl ? `\nTrack: ${s.trackingUrl}` : ""}\nOrder details: ${base}/order/${o.number}?t=${orderToken(o.number)}`,
    }).catch(() => {});
    revalidatePath(`/admin/orders/${number}`);
    return { ok: true as const, ...s };
  } catch (e) {
    return { ok: false as const, error: e instanceof ShippingError ? e.message : "Couldn't create the shipment. Try again." };
  }
}

// ── Discounts ───────────────────────────────────────────────────
const DiscountInput = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(30).transform(normCode).refine((c) => /^[A-Z0-9_-]+$/.test(c), "Use letters, numbers, - or _ only"),
  type: z.enum(["percent", "fixed", "free_shipping"]),
  value: z.number().int().min(0).max(100_000),
  minSubtotal: z.number().int().min(0).max(1_000_000),
  maxDiscount: z.number().int().min(0).max(100_000).nullable(),
  startsAt: z.string().nullable(), endsAt: z.string().nullable(),
  usageLimit: z.number().int().min(1).max(1_000_000).nullable(),
  oncePerCustomer: z.boolean(), active: z.boolean(),
}).refine((d) => d.type !== "percent" || (d.value >= 1 && d.value <= 100), { message: "Percent must be between 1 and 100", path: ["value"] })
  .refine((d) => d.type !== "fixed" || d.value >= 1, { message: "Enter an amount", path: ["value"] });

export async function saveDiscount(id: number | null, raw: z.input<typeof DiscountInput>) {
  await requireStaff("manager");
  const p = DiscountInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const v = { ...p.data, startsAt: p.data.startsAt ? new Date(p.data.startsAt) : null, endsAt: p.data.endsAt ? new Date(p.data.endsAt) : null };
  const d = await db();
  try {
    if (id) await d.update(schema.discounts).set(v).where(eq(schema.discounts.id, id));
    else await d.insert(schema.discounts).values(v);
  } catch {
    return { ok: false as const, error: "A discount with that code already exists." };
  }
  revalidatePath("/admin/discounts");
  return { ok: true as const };
}

export async function deleteDiscount(id: number) {
  await requireStaff("manager");
  await (await db()).delete(schema.discounts).where(eq(schema.discounts.id, id));
  revalidatePath("/admin/discounts");
  return { ok: true as const };
}

// ── Taxes ───────────────────────────────────────────────────────
const TaxInput = z.object({
  slabs: z.array(z.object({ id: z.string().regex(/^[a-z0-9_-]{2,20}$/), name: z.string().min(1).max(40), rate: z.number().min(0).max(40) })).min(1).max(12),
  defaultSlab: z.string(),
  gstin: z.string().regex(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])?$/, "GSTIN format looks wrong (15 characters)"),
  businessState: z.string().min(2).max(60),
  legalName: z.string().min(2).max(120),
  pricesIncludeTax: z.boolean(),
}).refine((t) => t.slabs.some((s) => s.id === t.defaultSlab), { message: "Default slab must be one of the slabs" })
  .refine((t) => new Set(t.slabs.map((s) => s.id)).size === t.slabs.length, { message: "Slab IDs must be unique" });

export async function saveTax(raw: z.input<typeof TaxInput>) {
  await requireStaff("owner");
  const p = TaxInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  await upsert("tax", p.data);
  updateTag(SETTINGS_TAG);
  return { ok: true as const };
}

// ── Staff ───────────────────────────────────────────────────────
const StaffInput = z.object({ email: z.string().email(), role: z.enum(["customer", "support", "content", "manager", "owner"]) });

export async function setStaffRole(raw: z.input<typeof StaffInput>) {
  const me = await requireStaff("owner");
  const p = StaffInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: "Enter a valid email." };
  const email = p.data.email.trim().toLowerCase();
  const d = await db();
  if (email === me.email && p.data.role !== "owner") return { ok: false as const, error: "You can't remove your own owner access." };
  await d.insert(schema.users).values({ email, role: p.data.role }).onConflictDoUpdate({ target: schema.users.email, set: { role: p.data.role } });
  revalidatePath("/admin/staff");
  return { ok: true as const };
}

// ── Content (pages + journal) ───────────────────────────────────
import { cleanHtml } from "./sanitize";
import { CONTENT_TAG } from "./content";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const RESERVED = /^(shop|products|checkout|account|order|login|admin|api|search|stack-builder|journal|invoice|styleguide|press|science|dr-manu-bora)(\/|$)/;
const ContentInput = z.object({
  slug: z.string().min(2).max(120).regex(SLUG, "Slug: lowercase letters, numbers, - and /"),
  title: z.string().trim().min(2).max(160),
  body: z.string().max(200_000),
  excerpt: z.string().max(400).optional(),
  image: z.string().max(300).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(170).optional(),
  published: z.boolean(),
});

export async function saveContent(kind: "page" | "article", originalSlug: string | null, raw: z.input<typeof ContentInput>) {
  await requireStaff("content");
  const p = ContentInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  if (kind === "page" && RESERVED.test(p.data.slug)) return { ok: false as const, error: "That URL is used by the store. Pick another slug." };
  const d = await db();
  const body = cleanHtml(p.data.body);
  const common = { title: p.data.title, body, seoTitle: p.data.seoTitle || null, seoDescription: p.data.seoDescription || null, published: p.data.published, updatedAt: new Date() };
  try {
    if (kind === "page") {
      if (originalSlug) await d.update(schema.pages).set({ ...common, slug: p.data.slug }).where(eq(schema.pages.slug, originalSlug));
      else await d.insert(schema.pages).values({ ...common, slug: p.data.slug });
    } else {
      const extra = { excerpt: p.data.excerpt ?? "", image: p.data.image || null };
      if (originalSlug) await d.update(schema.articles).set({ ...common, ...extra, slug: p.data.slug }).where(eq(schema.articles.slug, originalSlug));
      else await d.insert(schema.articles).values({ ...common, ...extra, slug: p.data.slug });
    }
  } catch {
    return { ok: false as const, error: "That slug is already in use." };
  }
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/content");
  return { ok: true as const, slug: p.data.slug };
}

export async function deleteContent(kind: "page" | "article", slug: string) {
  await requireStaff("manager");
  const d = await db();
  if (kind === "page") await d.delete(schema.pages).where(eq(schema.pages.slug, slug));
  else await d.delete(schema.articles).where(eq(schema.articles.slug, slug));
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/content");
  return { ok: true as const };
}

export async function setEnquiryHandled(id: number, handled: boolean) {
  await requireStaff("support");
  await (await db()).update(schema.enquiries).set({ handled }).where(eq(schema.enquiries.id, id));
  revalidatePath("/admin/inbox");
  return { ok: true as const };
}

export async function sendRecoveryEmail(id: number) {
  await requireStaff("support");
  const d = await db();
  const [r] = await d.select().from(schema.checkoutDrafts).where(eq(schema.checkoutDrafts.id, id)).limit(1);
  if (!r || r.recoveredOrderId) return { ok: false as const, error: "Already recovered." };
  const base = process.env.SITE_URL ?? "http://localhost:3100";
  await sendEmail({
    to: r.email, subject: "You left something in your cart",
    text: `Hi${r.name ? ` ${r.name.split(" ")[0]}` : ""},\n\nYour cart is saved: ${r.lines.map((l) => `${l.title} × ${l.qty}`).join(", ")}.\nPick up where you left off: ${base}/checkout?recover=${r.token}\n\nQuestions? Just reply to this email.`,
  });
  await d.update(schema.checkoutDrafts).set({ reminderSentAt: new Date() }).where(eq(schema.checkoutDrafts.id, id));
  revalidatePath("/admin/abandoned");
  return { ok: true as const };
}
