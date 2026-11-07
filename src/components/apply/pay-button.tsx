"use client";

import Script from "next/script";
import { useState, useTransition } from "react";
import { confirmApplicationPayment, startApplicationPayment } from "@/lib/application-actions";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

export function PayButton({ token, label }: { token: string; label: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return <p className="border border-ok p-4 text-[15px] text-ok">Payment received. Your seat is confirmed, and we&apos;ve emailed you a receipt.</p>;
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button disabled={pending} onClick={() => start(async () => {
        setMsg(null);
        const r = await startApplicationPayment(token);
        if (!r.ok) return setMsg({ ok: false, text: r.error });
        if (!window.Razorpay) return setMsg({ ok: false, text: "Payment window failed to load. Check your connection." });
        new window.Razorpay({
          key: r.keyId, order_id: r.orderId, amount: r.amount, currency: "INR", name: "Arthroscopy College", description: `Application ${r.number}`, prefill: r.prefill, theme: { color: "#192136" },
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const c = await confirmApplicationPayment({ token, orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
            setMsg(c.ok ? { ok: true, text: "" } : { ok: false, text: c.error });
          },
        }).open();
      })} className="h-13 w-full rounded-full bg-navy text-[14px] font-semibold text-white hover:bg-black disabled:opacity-50">{pending ? "Opening secure payment…" : label}</button>
      {msg && !msg.ok && <p role="alert" className="mt-3 text-[14px] text-sale">{msg.text}</p>}
    </>
  );
}
