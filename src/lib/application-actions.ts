"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { currentUser } from "./auth";
import { requireStaff } from "./admin";
import { sendEmail } from "./email";
import { getProgram, inr } from "./programs";
import { createRazorpayOrder, razorpayEnabled, verifyPaymentSignature } from "./razorpay";

const PHONE = /^\+?[0-9][0-9\s-]{7,15}$/;
const Apply = z.object({
  programSlug: z.string().max(80),
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
  const program = getProgram(p.data.programSlug);
  if (!program) return { ok: false as const, error: "Choose a program.", field: "programSlug" };
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
    }).returning();
    const [b] = await tx.update(schema.applications).set({ number: `AC-${1000 + a.id}` }).where(eq(schema.applications.id, a.id)).returning();
    return b;
  });
  await Promise.all([
    sendEmail({ to: email, subject: `Application received: ${program.title} (${app.number})`,
      text: `Hi ${p.data.name.split(" ")[0]},\n\nThanks for applying to the ${program.title}. Your application number is ${app.number}.\nOur coordinator will review it and call you within 2 working days.\n\nTrack it any time: sign in at /account with this email.\n\nArthroscopy College\n+91 96506 20870` }).catch(() => {}),
    sendEmail({ to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com", subject: `New application ${app.number}: ${program.title}`,
      text: `${p.data.name} · ${email} · ${p.data.phone} · ${p.data.country}\n${p.data.qualification}${p.data.institution ? ` @ ${p.data.institution}` : ""} · ${p.data.experienceYears ?? "?"} yrs\nPreferred start: ${p.data.preferredStart ?? "-"}\nCV: ${p.data.cvLink ?? "-"}\n\n${p.data.message}` }).catch(() => {}),
  ]);
  return { ok: true as const, number: app.number };
}

// ── Admin decisions ──
const Decide = z.object({
  id: z.number().int(),
  status: z.enum(["reviewing", "accepted", "rejected", "enrolled", "withdrawn"]),
  feeAmount: z.number().int().min(0).max(10_000_000).nullable().optional(),
  depositPercent: z.number().int().min(1).max(100).optional(),
  gstRate: z.number().int().min(0).max(28).optional(),
  cohort: z.string().max(40).optional(),
  staffNote: z.string().max(2000).optional(),
});

export async function decideApplication(raw: z.input<typeof Decide>) {
  await requireStaff("support");
  const p = Decide.parse(raw);
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.id, p.id)).limit(1);
  if (!a) return { ok: false as const, error: "Not found" };
  const program = getProgram(a.programSlug);
  const base = process.env.SITE_URL ?? "http://localhost:3100";
  const patch: Partial<typeof schema.applications.$inferInsert> = { status: p.status, updatedAt: new Date(), cohort: p.cohort ?? a.cohort, staffNote: p.staffNote ?? a.staffNote };

  if (p.status === "accepted") {
    if (!p.feeAmount) return { ok: false as const, error: "Enter the program fee to accept." };
    const gst = p.gstRate ?? 18;
    const total = Math.round(p.feeAmount * (1 + gst / 100));
    const payNow = Math.round((total * (p.depositPercent ?? 100)) / 100);
    Object.assign(patch, { feeAmount: p.feeAmount, gstRate: gst, payNow, paymentToken: a.paymentToken ?? crypto.randomBytes(18).toString("base64url") });
  }
  const [u] = await d.update(schema.applications).set(patch).where(eq(schema.applications.id, a.id)).returning();

  const first = a.name.split(" ")[0];
  const mail: Record<string, { s: string; t: string } | null> = {
    accepted: { s: `You're accepted: ${program?.title ?? "Arthroscopy College"}`, t: `Hi ${first},\n\nCongratulations, your application ${a.number} has been accepted${u.cohort ? ` for the ${u.cohort} batch` : ""}.\n\nFee: ${inr(u.feeAmount ?? 0)} + ${u.gstRate}% GST\nPayable now to confirm your seat: ${inr(u.payNow ?? 0)}\n\nPay securely here: ${base}/pay/${u.paymentToken}\n\nQuestions? Call +91 96506 20870.\n\nArthroscopy College` },
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

// ── Payment link ──
export async function startApplicationPayment(token: string) {
  if (!/^[\w-]{16,64}$/.test(token)) return { ok: false as const, error: "Invalid link." };
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a || a.status !== "accepted" || !a.payNow) return { ok: false as const, error: a?.status === "paid" ? "This fee has already been paid." : "This payment link isn't active." };
  if (!(await razorpayEnabled())) return { ok: false as const, error: "Online payment isn't configured yet. Please contact the coordinator." };
  const rzp = await createRazorpayOrder(a.payNow, a.number);
  await d.update(schema.applications).set({ razorpayOrderId: rzp.id }).where(eq(schema.applications.id, a.id));
  return { ok: true as const, keyId: rzp.keyId, orderId: rzp.id, amount: rzp.amount, number: a.number, prefill: { name: a.name, email: a.email, contact: a.phone } };
}

export async function confirmApplicationPayment(input: { token: string; orderId: string; paymentId: string; signature: string }) {
  if (!(await verifyPaymentSignature(input.orderId, input.paymentId, input.signature))) return { ok: false as const, error: "Payment could not be verified." };
  const d = await db();
  const [a] = await d.update(schema.applications).set({ status: "paid", razorpayPaymentId: input.paymentId, paidAt: new Date(), updatedAt: new Date() })
    .where(and(eq(schema.applications.paymentToken, input.token), eq(schema.applications.razorpayOrderId, input.orderId), eq(schema.applications.status, "accepted"))).returning();
  if (a) {
    await sendEmail({ to: a.email, subject: `Seat confirmed: ${a.number}`, text: `Hi ${a.name.split(" ")[0]},\n\nWe've received ${inr(a.payNow ?? 0)}. Your seat is confirmed. Our coordinator will share joining details.\n\nArthroscopy College` }).catch(() => {});
    await sendEmail({ to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com", subject: `Fee paid: ${a.number} (${inr(a.payNow ?? 0)})`, text: `${a.name} · ${a.email}` }).catch(() => {});
  }
  return { ok: true as const };
}
