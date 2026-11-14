"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "./admin";
import { SETTINGS_TAG } from "./settings";
import { DEFAULT_SETTINGS } from "./pricing";
import { encrypt } from "./secrets";
import { SECRET_FIELDS } from "./integrations";
import { testRazorpay } from "./razorpay";
import { sendEmail } from "./email";

const Status = z.enum(["pending_payment", "confirmed", "paid", "shipped", "delivered", "cancelled", "refunded"]);

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

export async function testIntegration(name: "razorpay", draft?: { keyId?: string; keySecret?: string }) {
  await requireStaff("owner");
  if (name === "razorpay") {
    const { razorpayConfig } = await import("./integrations");
    const saved = await razorpayConfig();
    const keyId = draft?.keyId || saved?.keyId, keySecret = (draft?.keySecret && draft.keySecret !== "__set__" ? draft.keySecret : saved?.keySecret);
    if (!keyId || !keySecret) return { ok: false as const, error: "Enter a Key ID and Key Secret first." };
    return testRazorpay(keyId, keySecret);
  }
  return { ok: false as const, error: "Unknown integration." };
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
