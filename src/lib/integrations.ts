import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decrypt } from "./secrets";

// Integration configs live in settings under "int:<name>". Fields ending in "Secret"/"Password"/"Token" are encrypted.
export type RazorpayConfig = { mode: "test" | "live"; keyId: string; keySecret: string; webhookSecret: string; enabled: boolean };
export type ShiprocketConfig = { enabled: boolean; email: string; password: string; pickupLocation: string };
export type DelhiveryConfig = { enabled: boolean; token: string; pickupName: string; mode: "staging" | "live" };
type P = "manual" | "shiprocket" | "delhivery";
export type ShippingConfig = { defaultProvider: P; codProvider: P; prepaidProvider: P };

export const SECRET_FIELDS = new Set(["keySecret", "webhookSecret", "password", "token"]);

async function read<T>(name: string): Promise<Partial<T>> {
  const [row] = await (await db()).select().from(schema.settings).where(eq(schema.settings.key, `int:${name}`));
  const raw = (row?.value ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = SECRET_FIELDS.has(k) && typeof v === "string" && v.startsWith("v1.") ? safeDecrypt(v) : v;
  }
  return out as Partial<T>;
}
const safeDecrypt = (v: string) => { try { return decrypt(v); } catch { return ""; } };

/** Razorpay: admin settings first, env vars as fallback. */
export async function razorpayConfig(): Promise<RazorpayConfig | null> {
  const c = await read<RazorpayConfig>("razorpay");
  const keyId = c.keyId || process.env.RAZORPAY_KEY_ID || "";
  const keySecret = c.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  const enabled = c.enabled ?? true;
  if (!keyId || !keySecret || !enabled) return null;
  return { mode: keyId.startsWith("rzp_live_") ? "live" : "test", keyId, keySecret, webhookSecret: c.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "", enabled };
}

export const shiprocketConfig = () => read<ShiprocketConfig>("shiprocket");
export const delhiveryConfig = () => read<DelhiveryConfig>("delhivery");
export async function shippingConfig(): Promise<ShippingConfig> {
  const c = { defaultProvider: "manual" as P, ...(await read<ShippingConfig>("shipping")) };
  return { ...c, codProvider: c.codProvider ?? c.defaultProvider, prepaidProvider: c.prepaidProvider ?? c.defaultProvider };
}

/** Raw (still-encrypted) values for the admin form; secrets are never sent back to the browser. */
export async function readMasked(name: string) {
  const [row] = await (await db()).select().from(schema.settings).where(eq(schema.settings.key, `int:${name}`));
  const raw = (row?.value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, SECRET_FIELDS.has(k) ? (v ? "__set__" : "") : v]));
}
