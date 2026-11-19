"use server";

import { z } from "zod";
import crypto from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail, sendLeadEmail } from "./email";

const PHONE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const Input = z.object({
  kind: z.enum(["clinic", "contact"]),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(PHONE, "Enter a valid 10-digit mobile").or(z.literal("")).optional(),
  service: z.string().max(80).optional(),
  preferredDate: z.string().max(20).optional(),
  message: z.string().trim().max(2000).optional().default(""),
  website: z.string().max(0).optional(), // honeypot: bots fill it, humans never see it
});

export async function submitEnquiry(raw: z.input<typeof Input>) {
  const p = Input.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  if (p.data.kind === "clinic" && !p.data.phone) return { ok: false as const, error: "Add a mobile number so the clinic can confirm your slot." };
  const d = await db();
  // simple rate limit: max 3 per email per hour
  const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.enquiries)
    .where(and(eq(schema.enquiries.email, p.data.email.toLowerCase()), gte(schema.enquiries.createdAt, new Date(Date.now() - 3600_000))));
  if (n >= 3) return { ok: false as const, error: "We've received your messages. The team will get back to you shortly." };
  await d.insert(schema.enquiries).values({
    kind: p.data.kind, name: p.data.name, email: p.data.email.toLowerCase(), phone: p.data.phone || null,
    service: p.data.service || null, preferredDate: p.data.preferredDate || null, message: p.data.message,
  });
  await sendEmail({
    to: process.env.TEAM_EMAIL ?? "orthosportin@gmail.com",
    subject: p.data.kind === "clinic" ? `New consultation request: ${p.data.service ?? "General"}` : `New contact message from ${p.data.name}`,
    text: `${p.data.name} <${p.data.email}> ${p.data.phone ?? ""}\n${p.data.service ? `Service: ${p.data.service}\n` : ""}${p.data.preferredDate ? `Preferred date: ${p.data.preferredDate}\n` : ""}\n${p.data.message}`,
  }).catch(() => {});
  await sendLeadEmail(p.data.kind === "clinic" ? `Consultation request: ${p.data.service ?? "General"} (${p.data.name})` : `Contact form: ${p.data.name}`, [
    ["Form", p.data.kind === "clinic" ? "Consultation request" : "Contact us"], ["Name", p.data.name], ["Email", p.data.email.toLowerCase()],
    ["Phone", p.data.phone], ["Service", p.data.service], ["Preferred date", p.data.preferredDate], ["Message", p.data.message],
  ]).catch(() => {});
  await sendEmail({
    to: p.data.email.toLowerCase(),
    subject: "We've received your message",
    text: `Hi ${p.data.name.split(" ")[0]},\n\nThanks for contacting Arthroscopy College${p.data.service ? ` about ${p.data.service}` : ""}. Our team will reply within one working day.\n\nYour message:\n${p.data.message}\n\nFor anything urgent, WhatsApp us on +91 96506 20870.\n\nArthroscopy College`,
  }).catch(() => {});
  return { ok: true as const };
}

// ── Abandoned checkout capture (called from checkout when email + cart exist) ──
const Draft = z.object({
  token: z.string().max(64).optional(),
  email: z.string().email(), phone: z.string().max(20).optional(), name: z.string().max(80).optional(),
  lines: z.array(z.object({ handle: z.string().max(200), title: z.string().max(200), months: z.number().int(), qty: z.number().int().min(1).max(20), price: z.number().int(), image: z.string().max(300).optional() })).min(1).max(30),
});

export async function saveCheckoutDraft(raw: z.input<typeof Draft>) {
  const p = Draft.safeParse(raw);
  if (!p.success) return { ok: false as const };
  const d = await db();
  const subtotal = p.data.lines.reduce((s, l) => s + l.price * l.qty, 0);
  const values = { email: p.data.email.toLowerCase(), phone: p.data.phone || null, name: p.data.name || null, lines: p.data.lines, subtotal, updatedAt: new Date() };
  if (p.data.token) {
    const r = await d.update(schema.checkoutDrafts).set(values).where(and(eq(schema.checkoutDrafts.token, p.data.token), sql`${schema.checkoutDrafts.recoveredOrderId} is null`)).returning();
    if (r.length) return { ok: true as const, token: p.data.token };
  }
  const token = crypto.randomBytes(16).toString("base64url");
  await d.insert(schema.checkoutDrafts).values({ ...values, token });
  return { ok: true as const, token };
}

export async function loadCheckoutDraft(token: string) {
  if (!/^[\w-]{10,64}$/.test(token)) return null;
  const [r] = await (await db()).select({ lines: schema.checkoutDrafts.lines, email: schema.checkoutDrafts.email }).from(schema.checkoutDrafts)
    .where(and(eq(schema.checkoutDrafts.token, token), sql`${schema.checkoutDrafts.recoveredOrderId} is null`)).limit(1);
  return r ?? null;
}
