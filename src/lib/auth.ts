import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
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
export const devCodesOnScreen = () => process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY && !process.env.SMTP_HOST;

export type OtpPurpose = "signin" | "signup" | "reset";
const OTP_SUBJECT: Record<OtpPurpose, [string, string]> = {
  signin: ["sign-in code", "Your sign-in code is"],
  signup: ["verification code", "Welcome to Arthroscopy College! Your email verification code is"],
  reset: ["password reset code", "Use this code to reset your password:"],
};

export async function requestOtp(rawEmail: string, purpose: OtpPurpose = "signin"): Promise<{ ok: true; devCode?: string } | { ok: false; error: string }> {
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
    subject: `${code} is your Arthroscopy College ${OTP_SUBJECT[purpose][0]}`,
    text: `${OTP_SUBJECT[purpose][1]} ${code}\n\nIt expires in ${OTP_MINUTES} minutes. If you didn't request it, you can ignore this email.`,
  });
  return devCodesOnScreen() ? { ok: true, devCode: code } : { ok: true };
}

export async function verifyOtp(rawEmail: string, code: string): Promise<{ ok: true; hasPassword: boolean } | { ok: false; error: string }> {
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

  const [user] = await d.insert(schema.users).values({ email }).onConflictDoUpdate({ target: schema.users.email, set: { email, failedLogins: 0, lockedUntil: null } }).returning();
  await startSession(user.id, email, user.role);
  return { ok: true, hasPassword: !!user.passwordHash };
}

/** Creates the session cookie; promotes ADMIN_EMAILS to owner; links applications submitted with this email. */
async function startSession(userId: number, email: string, role: string) {
  const d = await db();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(normEmail).filter(Boolean);
  if (admins.includes(email) && role === "customer") await d.update(schema.users).set({ role: "owner" }).where(eq(schema.users.id, userId));
  await d.update(schema.applications).set({ userId }).where(and(eq(schema.applications.email, email), isNull(schema.applications.userId)));
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await d.insert(schema.sessions).values({ tokenHash: sha(token), userId, expiresAt });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

// ── Passwords (scrypt, no extra dependency) ──
const scryptAsync = (pw: string, salt: Buffer) => new Promise<Buffer>((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));
export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${(await scryptAsync(pw, salt)).toString("base64")}`;
}
async function checkPassword(pw: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const k = await scryptAsync(pw, Buffer.from(salt, "base64"));
  const h = Buffer.from(hash, "base64");
  return h.length === k.length && crypto.timingSafeEqual(h, k);
}
export const passwordProblem = (pw: string) => pw.length < 8 ? "Use at least 8 characters." : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Use letters and at least one number." : pw.length > 200 ? "That password is too long." : null;

const LOCK_AFTER = 5, LOCK_MINUTES = 15;
export async function passwordLogin(rawEmail: string, pw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normEmail(rawEmail);
  const d = await db();
  const [user] = await d.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  const generic = { ok: false as const, error: "Email or password isn't right." };
  if (!user) { await hashPassword(pw); return generic; } // similar timing for unknown emails
  if (user.lockedUntil && user.lockedUntil > new Date()) return { ok: false, error: `Too many attempts. Try again in ${LOCK_MINUTES} minutes, or sign in with a code.` };
  if (!user.passwordHash) return { ok: false, error: "This account has no password yet. Sign in with an email code, then set one." };
  if (!(await checkPassword(pw, user.passwordHash))) {
    const n = user.failedLogins + 1;
    await d.update(schema.users).set({ failedLogins: n, lockedUntil: n >= LOCK_AFTER ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null }).where(eq(schema.users.id, user.id));
    return generic;
  }
  await d.update(schema.users).set({ failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
  await startSession(user.id, email, user.role);
  return { ok: true };
}

/** Sets/changes the signed-in user's password (after OTP sign-up / reset, or from the dashboard). */
export async function setOwnPassword(pw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Your session expired. Sign in again." };
  const problem = passwordProblem(pw);
  if (problem) return { ok: false, error: problem };
  const d = await db();
  await d.update(schema.users).set({ passwordHash: await hashPassword(pw), failedLogins: 0, lockedUntil: null }).where(eq(schema.users.id, user.id));
  await sendEmail({ to: user.email, subject: user.passwordHash ? "Your password was changed" : "Your password is set", text: `Your Arthroscopy College password was just ${user.passwordHash ? "changed" : "set"}. You can now sign in with your email and password.\n\nIf this wasn't you, reset it from the sign-in page and contact us on +91 96506 20870.` }).catch(() => {});
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

