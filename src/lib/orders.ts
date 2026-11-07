"use server";

import { z } from "zod";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db, schema } from "@/db";
import { currentUser, normEmail, orderToken } from "./auth";
import { totals, type AppliedDiscount } from "./pricing";
import { getSettings, getTax } from "./settings";
import { gstIn, rateFor, split } from "./tax";
import { claimDiscount, evaluateDiscount } from "./discounts";
import { CATALOG_TAG } from "./catalog";
import { createRazorpayOrder, razorpayEnabled, verifyPaymentSignature } from "./razorpay";
import { sendEmail } from "./email";

const PINCODE = /^[1-9][0-9]{5}$/;
const PHONE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

const Input = z.object({
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  address: z.object({
    name: z.string().min(2, "Enter your full name").max(80),
    line1: z.string().min(4, "Enter your house / street").max(160),
    line2: z.string().max(160).optional().default(""),
    city: z.string().min(2, "Enter your city").max(60),
    state: z.string().min(2, "Select your state").max(60),
    pincode: z.string().regex(PINCODE, "Enter a valid 6-digit pincode"),
  }),
  method: z.enum(["cod", "razorpay"]),
  discountCode: z.string().max(40).optional(),
  draftToken: z.string().max(64).optional(),
  lines: z.array(z.object({ handle: z.string().max(200), months: z.number().int().min(0).max(24), qty: z.number().int().min(1).max(20) })).min(1, "Your cart is empty").max(30),
});

export type PlaceOrderInput = z.input<typeof Input>;
export type PlaceOrderResult =
  | { ok: false; error: string; field?: string }
  | { ok: true; kind: "done"; number: string; token: string }
  | { ok: true; kind: "razorpay"; number: string; token: string; keyId: string; rzpOrderId: string; amount: number; prefill: { name: string; email: string; contact: string } };

class OrderError extends Error {}

/** Checkout "Apply" button: validates a code and returns the amount for display. */
export async function previewDiscount(code: string, subtotal: number, email?: string) {
  const r = await evaluateDiscount(code, Math.max(0, Math.floor(subtotal)), email);
  return r.ok ? { ok: true as const, code: r.code, amount: r.amount, freeShipping: r.freeShipping, label: r.label } : r;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export async function placeOrder(raw: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: issue.path.join(".") };
  }
  const input = parsed.data;
  if (input.method === "razorpay" && !(await razorpayEnabled())) return { ok: false, error: "Online payment isn't available yet. Please choose Cash on Delivery." };
  const settings = await getSettings();
  if (input.method === "cod" && !settings.codEnabled) return { ok: false, error: "Cash on Delivery isn't available right now. Please pay online." };

  const d = await db();
  // Re-price every line from the database. Never trust client prices.
  const handles = [...new Set(input.lines.map((l) => l.handle))];
  const rows = await d.select({ v: schema.variants, p: schema.products }).from(schema.variants)
    .innerJoin(schema.products, eq(schema.variants.productHandle, schema.products.handle))
    .where(and(inArray(schema.variants.productHandle, handles), eq(schema.products.status, "active")));

  const items = [];
  for (const l of input.lines) {
    const r = rows.find((x) => x.v.productHandle === l.handle && x.v.months === l.months);
    if (!r || !r.v.available || (r.v.stock !== null && r.v.stock < l.qty)) return { ok: false, error: `Sorry, ${r?.p.title ?? "an item in your cart"} is no longer available. Please remove it to continue.` };
    items.push({ variantId: r.v.id, tracked: r.v.stock !== null, taxSlab: r.p.taxSlab, hsn: r.p.hsn, productHandle: l.handle, title: r.p.title, image: r.p.images[0] ?? null, months: l.months, price: r.v.price, compareAt: r.v.compareAt, qty: l.qty });
  }
  // merge duplicate lines
  const merged = Object.values(items.reduce<Record<string, (typeof items)[number]>>((acc, it) => {
    const k = `${it.productHandle}:${it.months}`;
    acc[k] = acc[k] ? { ...acc[k], qty: acc[k].qty + it.qty } : it;
    return acc;
  }, {}));

  const subtotal = merged.reduce((s, it) => s + it.price * it.qty, 0);
  const user = await currentUser();
  const email = normEmail(input.email);
  let discount: (AppliedDiscount & { id: number }) | null = null;
  if (input.discountCode?.trim()) {
    const r = await evaluateDiscount(input.discountCode, subtotal, email);
    if (!r.ok) return { ok: false, error: r.error, field: "discountCode" };
    discount = r;
  }
  const t = totals(subtotal, input.method, settings, discount);
  // GST (prices are tax-inclusive): per line on the discounted value, fees at the order's highest rate
  const tax = await getTax();
  const ratio = subtotal ? (subtotal - t.discount) / subtotal : 1;
  const lineTax = merged.map((m) => ({ ...m, taxRate: rateFor(tax, m.taxSlab) }));
  const goodsTax = lineTax.reduce((s, m) => s + gstIn(Math.round(m.price * m.qty * ratio), m.taxRate), 0);
  const feeRate = Math.max(0, ...lineTax.map((m) => m.taxRate));
  const taxTotal = goodsTax + gstIn(t.shipping + t.codFee, feeRate);
  const taxSplit = split(taxTotal, input.address.state, tax.businessState);

  let order;
  try {
  order = await d.transaction(async (tx) => {
    if (discount && !(await claimDiscount(tx, discount.id))) throw new OrderError("That code has just reached its usage limit.");
    // decrement tracked stock; the guard prevents overselling under concurrent checkouts
    for (const it of merged.filter((m) => m.tracked)) {
      const ok = await tx.update(schema.variants).set({ stock: sql`${schema.variants.stock} - ${it.qty}` })
        .where(and(eq(schema.variants.id, it.variantId), gte(schema.variants.stock, it.qty))).returning();
      if (!ok.length) throw new OrderError(`Sorry, ${it.title} just sold out.`);
    }
    // temp unique number, then derive the public number from the serial id (race-free)
    const [created] = await tx.insert(schema.orders).values({
      number: `tmp-${crypto.randomUUID()}`, userId: user?.id ?? null, email, phone: input.phone.replace(/\D/g, "").slice(-10),
      status: input.method === "cod" ? "confirmed" : "pending_payment", paymentMethod: input.method,
      taxTotal, taxSplit, subtotal: t.subtotal, discount: t.discount, discountCode: discount?.code ?? null, shipping: t.shipping, codFee: t.codFee, total: t.total,
      shippingAddress: { ...input.address, phone: input.phone },
    }).returning();
    const [o] = await tx.update(schema.orders).set({ number: `RC-${100000 + created.id}` }).where(eq(schema.orders.id, created.id)).returning();
    await tx.insert(schema.orderItems).values(lineTax.map((m) => ({ productHandle: m.productHandle, title: m.title, image: m.image, months: m.months, price: m.price, compareAt: m.compareAt, qty: m.qty, taxRate: m.taxRate, hsn: m.hsn, orderId: o.id })));
    if (user) {
      const has = await tx.select({ id: schema.addresses.id }).from(schema.addresses).where(eq(schema.addresses.userId, user.id)).limit(1);
      if (!has.length) await tx.insert(schema.addresses).values({ userId: user.id, data: { ...input.address, phone: input.phone }, isDefault: true });
    }
    return o;
  });
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    throw e;
  }
  if (merged.some((m) => m.tracked)) updateTag(CATALOG_TAG); // stock changed
  if (input.draftToken) await d.update(schema.checkoutDrafts).set({ recoveredOrderId: order.id }).where(eq(schema.checkoutDrafts.token, input.draftToken)).catch(() => {});
  else await d.update(schema.checkoutDrafts).set({ recoveredOrderId: order.id }).where(and(eq(schema.checkoutDrafts.email, email), sql`${schema.checkoutDrafts.recoveredOrderId} is null`)).catch(() => {});

  const token = orderToken(order.number);

  if (input.method === "cod") {
    await confirmationEmail(order.number, email, t.total, "Cash on Delivery").catch(() => {});
    return { ok: true, kind: "done", number: order.number, token };
  }

  const rzp = await createRazorpayOrder(t.total, order.number);
  await d.update(schema.orders).set({ razorpayOrderId: rzp.id }).where(eq(schema.orders.id, order.id));
  return {
    ok: true, kind: "razorpay", number: order.number, token, keyId: rzp.keyId, rzpOrderId: rzp.id, amount: rzp.amount,
    prefill: { name: input.address.name, email, contact: input.phone },
  };
}

export async function confirmRazorpayPayment(input: { number: string; orderId: string; paymentId: string; signature: string }) {
  if (!(await verifyPaymentSignature(input.orderId, input.paymentId, input.signature))) return { ok: false as const, error: "Payment could not be verified." };
  const d = await db();
  const [o] = await d.update(schema.orders)
    .set({ status: "paid", razorpayPaymentId: input.paymentId })
    .where(and(eq(schema.orders.number, input.number), eq(schema.orders.razorpayOrderId, input.orderId), eq(schema.orders.status, "pending_payment")))
    .returning();
  if (o) await confirmationEmail(o.number, o.email, o.total, "Paid online").catch(() => {});
  return { ok: true as const, token: orderToken(input.number) };
}

export async function razorpayAvailable() {
  return await razorpayEnabled();
}

async function confirmationEmail(number: string, email: string, total: number, method: string) {
  const base = process.env.SITE_URL ?? "http://localhost:3200";
  await sendEmail({
    to: email,
    subject: `Order ${number} confirmed`,
    text: `Thank you for your order ${number}.\nTotal: ${inr(total)} (${method}).\nView it any time: ${base}/order/${number}?t=${orderToken(number)}`,
  });
}
