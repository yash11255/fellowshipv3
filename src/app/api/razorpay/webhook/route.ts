import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay → POST /api/razorpay/webhook (events: payment.captured, payment.failed).
// Backstop for customers who pay but close the tab before the client-side confirmation runs.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? ""))) {
    return new Response("invalid signature", { status: 401 });
  }
  const evt = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { id: string; order_id: string } } } };
  const p = evt.payload?.payment?.entity;
  if (evt.event === "payment.captured" && p?.order_id) {
    const d = await db();
    await d.update(schema.orders).set({ status: "paid", razorpayPaymentId: p.id })
      .where(and(eq(schema.orders.razorpayOrderId, p.order_id), eq(schema.orders.status, "pending_payment")));
  }
  return Response.json({ ok: true });
}
