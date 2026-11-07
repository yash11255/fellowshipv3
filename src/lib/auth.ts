import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmail } from "./email";

const COOKIE = "rc_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 45;

export function secret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");
  return "dev-only-insecure-secret-change-me";
}

const sha = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");
export const normEmail = (e: string) => e.trim().toLowerCase();

/** True only in local development without an email provider: codes are shown on screen for testing. */
export const devCodesOnScreen = () => process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY;

export async function requestOtp(rawEmail: string): Promise<{ ok: true; devCode?: string } | { ok: false; error: string }> {
  const email = normEmail(rawEmail);
  const d = await db();
  const [last] = await d.select().from(schema.otpCodes).where(eq(schema.otpCodes.email, email)).orderBy(desc(schema.otpCodes.createdAt)).limit(1);
  if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_SECONDS * 1000) {
    return { ok: false, error: `Please wait a few seconds before requesting another code.` };
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await d.delete(schema.otpCodes).where(eq(schema.otpCodes.email, email));
  await d.insert(schema.otpCodes).values({ email, codeHash: sha(`${email}:${code}`), expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) });
  await sendEmail({
    to: email,
    subject: `${code} is your Arthroscopy College sign-in code`,
    text: `Your sign-in code is ${code}. It expires in ${OTP_MINUTES} minutes. If you didn't request it, ignore this email.`,
  });
  return devCodesOnScreen() ? { ok: true, devCode: code } : { ok: true };
}

export async function verifyOtp(rawEmail: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normEmail(rawEmail);
  const d = await db();
  const [row] = await d.select().from(schema.otpCodes)
    .where(and(eq(schema.otpCodes.email, email), gt(schema.otpCodes.expiresAt, new Date()))).limit(1);
  if (!row) return { ok: false, error: "That code has expired. Request a new one." };
  if (row.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, error: "Too many attempts. Request a new code." };

  const match = crypto.timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(sha(`${email}:${code.trim()}`)));
  if (!match) {
    await d.update(schema.otpCodes).set({ attempts: row.attempts + 1 }).where(eq(schema.otpCodes.id, row.id));
    return { ok: false, error: "That code isn't right. Check and try again." };
  }
  await d.delete(schema.otpCodes).where(eq(schema.otpCodes.email, email));

  let [user] = await d.insert(schema.users).values({ email }).onConflictDoUpdate({ target: schema.users.email, set: { email } }).returning();
  // bootstrap staff: emails listed in ADMIN_EMAILS become owners on sign-in
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(normEmail).filter(Boolean);
  if (admins.includes(email) && user.role === "customer") {
    [user] = await d.update(schema.users).set({ role: "owner" }).where(eq(schema.users.id, user.id)).returning();
  }
  // attach earlier guest orders placed with this email
  await d.update(schema.orders).set({ userId: user.id }).where(and(eq(schema.orders.email, email)));

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await d.insert(schema.sessions).values({ tokenHash: sha(token), userId: user.id, expiresAt });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
  return { ok: true };
}

export async function currentUser() {
  await connection(); // per-request: reads cookies + current time
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const d = await db();
  const [row] = await d.select({ user: schema.users }).from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.tokenHash, sha(token)), gt(schema.sessions.expiresAt, new Date()))).limit(1);
  return row?.user ?? null;
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await (await db()).delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha(token)));
  jar.delete(COOKIE);
}

/** Signed token so guests can view their own order confirmation without an account. */
export const orderToken = (number: string) => sha(`order:${number}`).slice(0, 24);
export const checkOrderToken = (number: string, t: string | undefined) =>
  !!t && t.length === 24 && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(orderToken(number)));
