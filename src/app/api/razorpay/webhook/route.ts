import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Razorpay → POST /api/razorpay/webhook (event: payment.captured).
// Backstop for applicants who pay but close the tab before the client-side confirmation runs.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") ?? ""))) {
    return new Response("invalid signature", { status: 401 });
  }
  const evt = JSON.parse(raw) as { event: string; payload?: { payment?: { entity?: { id: string; order_id: string } } } };
  const p = evt.payload?.payment?.entity;
  if (evt.event === "payment.captured" && p?.order_id) {
    const d = await db();
    await d.update(schema.applications).set({ status: "paid", razorpayPaymentId: p.id, paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.applications.razorpayOrderId, p.order_id), eq(schema.applications.status, "accepted")));
  }
  return Response.json({ ok: true });
}
