import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { AppliedDiscount } from "./pricing";

type Result = ({ ok: true } & AppliedDiscount & { id: number }) | { ok: false; error: string };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const normCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

/** Validate a code against a subtotal. Pure read; usage is claimed atomically in claimDiscount(). */
export async function evaluateDiscount(rawCode: string, subtotal: number, email?: string): Promise<Result> {
  const code = normCode(rawCode);
  if (!code || code.length > 40) return { ok: false, error: "Enter a valid code." };
  const d = await db();
  const [x] = await d.select().from(schema.discounts).where(eq(schema.discounts.code, code)).limit(1);
  const now = new Date();
  if (!x || !x.active) return { ok: false, error: "That code isn't valid." };
  if (x.startsAt && x.startsAt > now) return { ok: false, error: "That code isn't active yet." };
  if (x.endsAt && x.endsAt < now) return { ok: false, error: "That code has expired." };
  if (x.usageLimit !== null && x.usedCount >= x.usageLimit) return { ok: false, error: "That code has reached its usage limit." };
  if (subtotal < x.minSubtotal) return { ok: false, error: `Add ${inr(x.minSubtotal - subtotal)} more to use this code (min. ${inr(x.minSubtotal)}).` };
  if (x.oncePerCustomer && email) {
    const [used] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.orders)
      .where(and(eq(schema.orders.email, email.toLowerCase()), eq(schema.orders.discountCode, code), sql`${schema.orders.status} not in ('cancelled')`));
    if (used.n > 0) return { ok: false, error: "You've already used this code." };
  }
  let amount = 0, label = "";
  if (x.type === "percent") {
    amount = Math.floor((subtotal * Math.min(100, x.value)) / 100);
    if (x.maxDiscount) amount = Math.min(amount, x.maxDiscount);
    label = `${x.value}% off${x.maxDiscount ? ` (up to ${inr(x.maxDiscount)})` : ""}`;
  } else if (x.type === "fixed") {
    amount = Math.min(x.value, subtotal);
    label = `${inr(x.value)} off`;
  } else {
    label = "Free shipping";
  }
  return { ok: true, id: x.id, code, amount, freeShipping: x.type === "free_shipping", label };
}

/** Atomically consume one use. Returns false if the limit was hit concurrently. */
type DB = Awaited<ReturnType<typeof db>>;
type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];
export async function claimDiscount(tx: Tx, id: number) {
  const r = await tx.update(schema.discounts).set({ usedCount: sql`${schema.discounts.usedCount} + 1` })
    .where(and(eq(schema.discounts.id, id), sql`(${schema.discounts.usageLimit} is null or ${schema.discounts.usedCount} < ${schema.discounts.usageLimit})`))
    .returning();
  return r.length > 0;
}
