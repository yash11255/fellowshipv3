import { verifyWebhookSignature } from "@/lib/razorpay";
import { settlePaymentByOrderId } from "@/lib/application-actions";

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
    await settlePaymentByOrderId(p.order_id, p.id);
  }
  return Response.json({ ok: true });
}
