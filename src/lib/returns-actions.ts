"use server";

import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { checkOrderToken, currentUser } from "./auth";
import { requireStaff } from "./admin";
import { sendEmail } from "./email";

export const RETURN_REASONS = ["Damaged or leaking", "Wrong item received", "Missing item", "Expired or near expiry", "Changed my mind (unopened)", "Other"] as const;

const Input = z.object({ number: z.string().max(20), token: z.string().max(40).optional(), reason: z.enum(RETURN_REASONS), details: z.string().trim().max(1500) });

export async function requestReturn(raw: z.input<typeof Input>) {
  const p = Input.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const d = await db();
  const [o] = await d.select().from(schema.orders).where(eq(schema.orders.number, p.data.number)).limit(1);
  if (!o) return { ok: false as const, error: "Order not found." };
  const user = await currentUser();
  if (!checkOrderToken(o.number, p.data.token) && !(user && o.userId === user.id)) return { ok: false as const, error: "Please sign in to request a return." };
  if (!["shipped", "delivered"].includes(o.status)) return { ok: false as const, error: "Returns can be requested once your order has shipped." };
  const open = await d.select({ id: schema.returns.id }).from(schema.returns).where(and(eq(schema.returns.orderId, o.id), inArray(schema.returns.status, ["requested", "approved"]))).limit(1);
  if (open.length) return { ok: false as const, error: "There's already an open return for this order." };
  if (p.data.reason === "Other" && p.data.details.length < 10) return { ok: false as const, error: "Please tell us a little more." };
  await d.insert(schema.returns).values({ orderId: o.id, reason: p.data.reason, details: p.data.details });
  await sendEmail({ to: process.env.TEAM_EMAIL ?? "team@reverseclinics.com", subject: `Return requested: ${o.number}`, text: `${o.email}: ${p.data.reason}\n${p.data.details}` }).catch(() => {});
  revalidatePath(`/order/${o.number}`);
  return { ok: true as const };
}

const Decide = z.object({ id: z.number().int(), status: z.enum(["approved", "rejected", "refunded"]), refundAmount: z.number().int().min(0).max(1_000_000).nullable(), staffNote: z.string().max(1000) });

export async function decideReturn(raw: z.input<typeof Decide>) {
  await requireStaff("support");
  const p = Decide.parse(raw);
  const d = await db();
  const [r] = await d.update(schema.returns).set({ status: p.status, refundAmount: p.refundAmount, staffNote: p.staffNote || null }).where(eq(schema.returns.id, p.id)).returning();
  if (!r) return { ok: false as const };
  const [o] = await d.select().from(schema.orders).where(eq(schema.orders.id, r.orderId)).limit(1);
  if (p.status === "refunded" && o) await d.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, o.id));
  if (o) {
    const text = { approved: "Your return has been approved. Our team will arrange pickup or a replacement and keep you posted.", rejected: `We couldn't approve this return.${p.staffNote ? ` ${p.staffNote}` : ""}`, refunded: `Your refund${p.refundAmount ? ` of ₹${p.refundAmount.toLocaleString("en-IN")}` : ""} has been processed. It can take 5–7 working days to reflect.` }[p.status];
    await sendEmail({ to: o.email, subject: `Update on your return for ${o.number}`, text }).catch(() => {});
  }
  revalidatePath("/admin/returns");
  return { ok: true as const };
}
