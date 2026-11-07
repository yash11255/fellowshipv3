import "server-only";
import crypto from "node:crypto";
import { razorpayConfig } from "./integrations";

export async function razorpayEnabled() {
  return !!(await razorpayConfig());
}

export async function createRazorpayOrder(amountInr: number, receipt: string) {
  const c = await razorpayConfig();
  if (!c) throw new Error("Razorpay is not configured");
  const auth = Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text().catch(() => "")}`);
  const j = (await res.json()) as { id: string; amount: number };
  return { ...j, keyId: c.keyId };
}

/** Admin "Test connection": lists 1 order to prove the keys work. */
export async function testRazorpay(keyId: string, keySecret: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
  });
  return res.ok ? { ok: true as const } : { ok: false as const, error: res.status === 401 ? "Razorpay rejected these keys (401)." : `Razorpay error ${res.status}` };
}

const safeEq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Checkout success callback: HMAC_SHA256(order_id|payment_id, key_secret) */
export async function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const c = await razorpayConfig();
  if (!c) return false;
  const expected = crypto.createHmac("sha256", c.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEq(expected, signature);
}

/** Webhook: HMAC_SHA256(raw body, webhook secret) */
export async function verifyWebhookSignature(rawBody: string, signature: string) {
  const c = await razorpayConfig();
  if (!c?.webhookSecret) return false;
  const expected = crypto.createHmac("sha256", c.webhookSecret).update(rawBody).digest("hex");
  return safeEq(expected, signature);
}
