"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { currentUser } from "./auth";
import { requireStaff } from "./admin";
import { sendEmail, sendLeadEmail } from "./email";
import { inr } from "./programs";
import { getProgramBySlug } from "./program-store";
import { getSlot, releaseSeat, seatsLeft, takeSeat } from "./slots";
import { createRazorpayOrder, razorpayEnabled, verifyPaymentSignature } from "./razorpay";
import { feeBreakdown, totalOf } from "./fee-math";
import { invoiceEmailHtml, invoiceModel, invoiceSettings, invoiceUrl, recordPayment } from "./invoices";

const DEFAULT_BALANCE_DUE_DAYS = 14;

const PHONE = /^\+?[0-9][0-9\s-]{7,15}$/;
const Apply = z.object({
  programSlug: z.string().max(80),
  slotId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(PHONE, "Enter a valid phone number with country code"),
  country: z.string().trim().min(2).max(60),
  qualification: z.string().trim().min(2, "Enter your qualification").max(80),
  institution: z.string().trim().max(120).optional(),
  experienceYears: z.number().int().min(0).max(60).nullable(),
  preferredStart: z.string().max(20).optional(),
  cvLink: z.string().trim().url("CV link must be a full URL (Google Drive, Dropbox…)").max(400).or(z.literal("")).optional(),
  message: z.string().trim().max(2000).optional().default(""),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitApplication(raw: z.input<typeof Apply>) {
  const p = Apply.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message, field: p.error.issues[0].path.join(".") };
  const program = await getProgramBySlug(p.data.programSlug);
  if (!program) return { ok: false as const, error: "Choose a program.", field: "programSlug" };

  let cohort: string | null = null;
  if (p.data.slotId) {
    const slot = await getSlot(p.data.slotId);
    if (!slot || slot.programSlug !== program.slug || slot.status !== "open") return { ok: false as const, error: "That batch isn't open any more — pick another.", field: "slotId" };
    if (seatsLeft(slot) === 0) return { ok: false as const, error: "That batch is full — pick another.", field: "slotId" };
    cohort = slot.label;
  }

  const d = await db();
  const email = p.data.email.toLowerCase();
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.applications)
    .where(and(eq(schema.applications.email, email), gte(schema.applications.createdAt, new Date(Date.now() - 3600_000))));
  if (n >= 3) return { ok: false as const, error: "We've received your applications. Our coordinator will call you shortly." };
  const user = await currentUser();
  const app = await d.transaction(async (tx) => {
    const [a] = await tx.insert(schema.applications).values({
      number: `tmp-${crypto.randomUUID()}`, programSlug: program.slug, name: p.data.name, email, phone: p.data.phone, country: p.data.country,
      qualification: p.data.qualification, institution: p.data.institution || null, experienceYears: p.data.experienceYears,
      preferredStart: p.data.preferredStart || null, cvLink: p.data.cvLink || null, message: p.data.message, userId: user?.id ?? null,
      slotId: p.data.slotId ?? null, cohort,
    }).returning();
    const [b] = await tx.update(schema.applications).set({ number: `AC-${1000 + a.id}` }).where(eq(schema.applications.id, a.id)).returning();
    return b;
  });
  await Promise.all([
    sendEmail({ to: email, subject: `Application received: ${program.title} (${app.number})`,
      text: `Hi ${p.data.name.split(" ")[0]},\n\nThanks for applying to the ${program.title}${cohort ? ` (${cohort} batch)` : ""}. Your application number is ${app.number}.\nOur coordinator will review it and call you within 2 working days.\n\nTrack it any time: sign in at /account with this email.\n\nArthroscopy College\n+91 96506 20870` }).catch(() => {}),
    sendEmail({ to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com", subject: `New application ${app.number}: ${program.title}`,
      text: `${p.data.name} · ${email} · ${p.data.phone} · ${p.data.country}\n${p.data.qualification}${p.data.institution ? ` @ ${p.data.institution}` : ""} · ${p.data.experienceYears ?? "?"} yrs\nPreferred start: ${p.data.preferredStart ?? "-"}${cohort ? `\nRequested batch: ${cohort}` : ""}\nCV: ${p.data.cvLink ?? "-"}\n\n${p.data.message}` }).catch(() => {}),
    sendLeadEmail(`Application ${app.number}: ${program.title} (${p.data.name})`, [
      ["Form", "Programme application"], ["Application no.", app.number], ["Programme", program.title], ["Batch", cohort],
      ["Name", p.data.name], ["Email", email], ["Phone", p.data.phone], ["Country", p.data.country],
      ["Qualification", p.data.qualification], ["Institution", p.data.institution], ["Experience (years)", p.data.experienceYears],
      ["Preferred start", p.data.preferredStart], ["CV", p.data.cvLink], ["Message", p.data.message],
    ], `Open in admin: ${process.env.SITE_URL ?? ""}/admin/applications/${app.number}`).catch(() => {}),
  ]);
  return { ok: true as const, number: app.number };
}

// ── Admin decisions ──
const Decide = z.object({
  id: z.number().int(),
  status: z.enum(["reviewing", "accepted", "rejected", "enrolled", "withdrawn"]),
  feeAmount: z.number().int().min(0).max(10_000_000).nullable().optional(),
  depositPercent: z.number().int().min(1).max(100).optional(),
  feeIncludesGst: z.boolean().optional(),
  gstRate: z.number().int().min(0).max(28).optional(),
  cohort: z.string().max(40).optional(),
  slotId: z.number().int().positive().nullable().optional(),
  staffNote: z.string().max(2000).optional(),
});

export async function decideApplication(raw: z.input<typeof Decide>) {
  await requireStaff("support");
  const p = Decide.parse(raw);
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.id, p.id)).limit(1);
  if (!a) return { ok: false as const, error: "Not found" };
  const program = await getProgramBySlug(a.programSlug);
  const base = process.env.SITE_URL ?? "http://localhost:3200";
  const patch: Partial<typeof schema.applications.$inferInsert> = { status: p.status, updatedAt: new Date(), cohort: p.cohort ?? a.cohort, staffNote: p.staffNote ?? a.staffNote };

  if (p.slotId !== undefined) {
    if (p.slotId === null) { patch.slotId = null; }
    else {
      const slot = await getSlot(p.slotId);
      if (!slot || slot.programSlug !== a.programSlug) return { ok: false as const, error: "Choose a slot that belongs to this programme." };
      if (slot.status !== "open") return { ok: false as const, error: "That batch is closed — reopen it or pick another." };
      patch.slotId = slot.id;
      patch.cohort = slot.label;
    }
  }

  if (p.status === "accepted") {
    if (!p.feeAmount) return { ok: false as const, error: "Enter the program fee to accept." };
    const gst = p.gstRate ?? 18;
    const b = feeBreakdown(p.feeAmount, gst, p.depositPercent ?? 100, !!p.feeIncludesGst);
    Object.assign(patch, { feeAmount: p.feeAmount, feeIncludesGst: !!p.feeIncludesGst, gstRate: gst, payNow: b.payNow, amountPaid: 0, balanceDueAt: null, paidAt: null, paymentToken: a.paymentToken ?? crypto.randomBytes(18).toString("base64url") });
  }
  const [u] = await d.update(schema.applications).set(patch).where(eq(schema.applications.id, a.id)).returning();

  const first = a.name.split(" ")[0];
  const mail: Record<string, { s: string; t: string } | null> = {
    accepted: { s: `You're accepted: ${program?.title ?? "Arthroscopy College"}`, t: `Hi ${first},\n\nCongratulations, your application ${a.number} has been accepted${u.cohort ? ` for the ${u.cohort} batch` : ""}.\n\n${(() => { const b = feeBreakdown(u.feeAmount ?? 0, u.gstRate, Math.round(((u.payNow ?? 0) / Math.max(1, totalOf(u))) * 100), u.feeIncludesGst); return `Programme fee: ${inr(b.fee)}\nGST (${u.gstRate}%): ${inr(b.gst)}\nTotal: ${inr(b.total)}${u.feeIncludesGst ? " (GST included)" : ""}\n\n${(u.payNow ?? 0) < b.total ? `Pay now to reserve your seat: ${inr(u.payNow ?? 0)}\nBalance later: ${inr(b.total - (u.payNow ?? 0))} (same link, after your seat is reserved)` : `Pay now: ${inr(u.payNow ?? 0)} (full amount)`}`; })()}\n\nPay securely here: ${base}/pay/${u.paymentToken}\n\nQuestions? Call +91 96506 20870.\n\nArthroscopy College` },
    rejected: { s: `Update on your application ${a.number}`, t: `Hi ${first},\n\nThank you for applying. We're unable to offer a seat this time.${p.staffNote ? `\n\n${p.staffNote}` : ""}\n\nYou're welcome to apply for a future batch.\n\nArthroscopy College` },
    enrolled: { s: `Welcome to Arthroscopy College`, t: `Hi ${first},\n\nYou're enrolled${u.cohort ? ` in the ${u.cohort} batch` : ""}. Our coordinator will share joining details shortly.\n\nArthroscopy College` },
    reviewing: null, withdrawn: null,
  };
  const m = mail[p.status];
  if (m) await sendEmail({ to: a.email, subject: m.s, text: m.t }).catch(() => {});
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${a.number}`);
  return { ok: true as const, payLink: u.paymentToken ? `${base}/pay/${u.paymentToken}` : null };
}

/** Manually frees a confirmed seat (e.g. the candidate called to cancel) without waiting for the balance deadline. */
export async function releaseApplicationSeat(id: number) {
  await requireStaff("manager");
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.id, id)).limit(1);
  if (!a) return { ok: false as const, error: "Not found" };
  if (a.status === "withdrawn") return { ok: false as const, error: "Already withdrawn." };
  // A seat is only held once a payment has landed (status paid/enrolled with money in).
  const heldSeat = !!a.slotId && a.amountPaid > 0 && (a.status === "paid" || a.status === "enrolled");
  const [w] = await d.update(schema.applications).set({
    status: "withdrawn", balanceDueAt: null, updatedAt: new Date(),
    staffNote: `${a.staffNote ? a.staffNote + "\n" : ""}Seat released by staff.`,
  }).where(and(eq(schema.applications.id, a.id), eq(schema.applications.status, a.status))).returning();
  if (w && heldSeat) await releaseSeat(a.slotId!);
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${a.number}`);
  return { ok: true as const };
}

// ── Payment link ──
/** Dummy payments: allowed until Razorpay keys are added, outside production (or with PAYMENTS_TEST_MODE=1). */
function testPaymentsAllowed() {
  return process.env.PAYMENTS_TEST_MODE === "1" || process.env.NODE_ENV !== "production";
}

type AppRow = typeof schema.applications.$inferSelect;
/** True while there's money still owed via the pay link: either the initial deposit, or a balance after it. */
const isPayable = (a: AppRow) => (a.status === "accepted" || (a.status === "paid" && a.amountPaid < totalOf(a))) && !!a.payNow;

async function balanceDueDaysFor(a: AppRow) {
  if (a.slotId) { const slot = await getSlot(a.slotId); if (slot) return slot.balanceDueDays; }
  return DEFAULT_BALANCE_DUE_DAYS;
}

/** Applies a successful payment: first payment claims the seat; when the total is covered the candidate is
 * enrolled automatically. Every payment gets a GST invoice, emailed to the candidate and the team. */
async function settlePayment(a: AppRow, paymentId: string) {
  const d = await db();
  const total = totalOf(a);
  const justPaid = a.payNow ?? 0;
  const newPaid = Math.min(a.amountPaid + justPaid, total);
  const fullyPaid = newPaid >= total;
  const firstPayment = a.status === "accepted";

  const dueDate = fullyPaid ? null : new Date(Date.now() + (await balanceDueDaysFor(a)) * 86_400_000);
  const patch: Partial<AppRow> = {
    status: fullyPaid ? "enrolled" : "paid", amountPaid: newPaid, razorpayPaymentId: paymentId, updatedAt: new Date(), paidAt: new Date(),
    payNow: fullyPaid ? 0 : total - newPaid,
    balanceDueAt: dueDate,
    // The order this payment settled is spent: clearing it stops a late/duplicate webhook for the same
    // order from being credited again as the balance.
    razorpayOrderId: null,
  };

  // Optimistic concurrency: only land this update if nothing changed since we read `a`. This runs before
  // the seat is claimed so a racing client-confirm + webhook can't both take a seat.
  let [u] = await d.update(schema.applications).set(patch)
    .where(and(eq(schema.applications.id, a.id), eq(schema.applications.status, a.status), eq(schema.applications.amountPaid, a.amountPaid)))
    .returning();
  if (!u) return null;

  let seatOk = true;
  if (firstPayment && a.slotId) seatOk = await takeSeat(a.slotId);
  if (!seatOk) {
    [u] = await d.update(schema.applications)
      .set({ staffNote: `${a.staffNote ? a.staffNote + "\n" : ""}⚠ Payment received but the slot was already full when the seat was claimed — reassign the batch or refund.` })
      .where(eq(schema.applications.id, a.id)).returning();
  }

  const kind = fullyPaid && firstPayment ? "full" : firstPayment ? "deposit" : "balance";
  const inv = await recordPayment(u, paymentId, justPaid, kind);
  const program = await getProgramBySlug(a.programSlug);
  const settings = await invoiceSettings();
  const first = a.name.split(" ")[0];
  const site = process.env.SITE_URL ?? "http://localhost:3200";

  const intro = fullyPaid
    ? `Hi ${first},\n\nPayment captured: ${inr(justPaid)}. Your fee is fully paid and you're enrolled${u.cohort ? ` in the ${u.cohort} batch` : ""}. Our coordinator will share joining details.\n\nYour invoice is below.`
    : `Hi ${first},\n\nPayment captured: ${inr(justPaid)} deposit. Your seat${u.cohort ? ` for ${u.cohort}` : ""} is reserved.\n\nBalance due: ${inr(total - newPaid)} by ${dueDate!.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}. Pay it any time before then at ${site}/pay/${a.paymentToken}. If it isn't paid by that date the seat is released.\n\nYour invoice for this payment is below.`;
  const subject = fullyPaid ? `Payment captured, you're enrolled: ${a.number}` : `Deposit received, seat reserved: ${a.number}`;
  const textInv = inv ? `\n\nInvoice ${inv.invoiceNo}: ${invoiceUrl(u, inv)}` : "";
  const html = inv ? invoiceEmailHtml(invoiceModel(u, inv, program?.title ?? "Programme fee", settings), intro, invoiceUrl(u, inv)) : undefined;
  await sendEmail({ to: a.email, subject, text: `${intro}${textInv}\n\nPayment reference: ${paymentId}\n\nArthroscopy College`, html }).catch(() => {});

  const teamIntro = `${fullyPaid ? "Fully paid, enrolled" : "Deposit paid, seat reserved"}: ${a.name} (${a.number}) paid ${inr(justPaid)}.\nPaid to date ${inr(newPaid)} of ${inr(total)}${fullyPaid ? "" : `, balance ${inr(total - newPaid)} due ${dueDate!.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`}.${!seatOk ? "\n⚠ Slot was full: needs manual reassignment or refund." : ""}\nAdmin: ${site}/admin/applications/${a.number}`;
  await sendEmail({ to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com", subject: `${fullyPaid ? "Enrolled" : "Deposit paid"}: ${a.number} (${inr(justPaid)})${inv ? ` · Invoice ${inv.invoiceNo}` : ""}`,
    text: `${teamIntro}${textInv}\nPayment ref: ${paymentId}`, html: inv ? invoiceEmailHtml(invoiceModel(u, inv, program?.title ?? "Programme fee", settings), teamIntro, invoiceUrl(u, inv)) : undefined }).catch(() => {});
  return u;
}

/** Completes a dummy payment (test mode only). `outcome: "failed"` leaves the application unpaid. */
export async function completeTestPayment(token: string, outcome: "success" | "failed") {
  if (!/^[\w-]{16,64}$/.test(token)) return { ok: false as const, error: "Invalid link." };
  if ((await razorpayEnabled()) || !testPaymentsAllowed()) return { ok: false as const, error: "Test payments are disabled." };
  if (outcome === "failed") return { ok: false as const, error: "Test payment failed (simulated). Nothing was charged; try again." };
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a || !isPayable(a)) return { ok: false as const, error: a?.status === "paid" ? "This fee has already been paid." : "This payment link isn't active." };
  const paymentId = `test_${crypto.randomBytes(6).toString("hex")}`;
  const u = await settlePayment(a, paymentId);
  if (!u) return { ok: false as const, error: "This payment was already processed." };
  return { ok: true as const, paymentId, fullyPaid: u.amountPaid >= totalOf(u) };
}

export async function startApplicationPayment(token: string) {
  if (!/^[\w-]{16,64}$/.test(token)) return { ok: false as const, error: "Invalid link." };
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a || !isPayable(a)) return { ok: false as const, error: a?.status === "paid" && a.amountPaid >= totalOf(a) ? "This fee has already been paid." : "This payment link isn't active." };
  if (!(await razorpayEnabled())) {
    if (testPaymentsAllowed()) return { ok: true as const, test: true as const, amount: (a.payNow ?? 0) * 100, number: a.number };
    return { ok: false as const, error: "Online payment isn't configured yet. Please contact the coordinator." };
  }
  const rzp = await createRazorpayOrder(a.payNow ?? 0, a.number);
  await d.update(schema.applications).set({ razorpayOrderId: rzp.id }).where(eq(schema.applications.id, a.id));
  return { ok: true as const, keyId: rzp.keyId, orderId: rzp.id, amount: rzp.amount, number: a.number, prefill: { name: a.name, email: a.email, contact: a.phone } };
}

export async function confirmApplicationPayment(input: { token: string; orderId: string; paymentId: string; signature: string }) {
  if (!(await verifyPaymentSignature(input.orderId, input.paymentId, input.signature))) return { ok: false as const, error: "Payment could not be verified." };
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(and(eq(schema.applications.paymentToken, input.token), eq(schema.applications.razorpayOrderId, input.orderId))).limit(1);
  if (!a || !isPayable(a)) return { ok: true as const }; // nothing to do — already settled
  const u = await settlePayment(a, input.paymentId);
  return { ok: true as const, fullyPaid: u ? u.amountPaid >= totalOf(u) : undefined };
}

/** Webhook backstop: the client-side confirm can be missed (tab closed mid-payment), so Razorpay's own
 * `payment.captured` event settles it the same way — same slot-claiming and deposit/balance logic. */
export async function settlePaymentByOrderId(orderId: string, paymentId: string) {
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.razorpayOrderId, orderId)).limit(1);
  if (!a || !isPayable(a)) return;
  await settlePayment(a, paymentId);
}
