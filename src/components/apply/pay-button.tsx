"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { completeTestPayment, confirmApplicationPayment, startApplicationPayment } from "@/lib/application-actions";
import { inr } from "@/lib/programs";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

/** Razorpay checkout; falls back to a clearly-labelled test checkout while Razorpay keys aren't configured. */
export function PayButton({ token, label }: { token: string; label: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [test, setTest] = useState<{ amount: number; number: string } | null>(null);
  const [pending, start] = useTransition();

  if (msg?.ok) return (
    <div className="rounded-[24px] bg-mist p-6" role="status">
      <p className="text-[20px] font-semibold tracking-[-0.02em]">Payment received. Your seat is reserved.</p>
      <p className="mt-2 text-ink/65">{msg.text || "We've emailed you a receipt."} Our coordinator will share joining details.</p>
      <Link href="/account" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-[14px] font-semibold text-white">Go to your dashboard</Link>
    </div>
  );

  const finishTest = (outcome: "success" | "failed") => start(async () => {
    const r = await completeTestPayment(token, outcome);
    setTest(null);
    setMsg(r.ok ? { ok: true, text: `Test payment reference ${r.paymentId}.` } : { ok: false, text: r.error });
  });

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button disabled={pending} onClick={() => start(async () => {
        setMsg(null);
        const r = await startApplicationPayment(token);
        if (!r.ok) return setMsg({ ok: false, text: r.error });
        if ("test" in r) return setTest({ amount: r.amount / 100, number: r.number });
        if (!window.Razorpay) return setMsg({ ok: false, text: "Payment window failed to load. Check your connection." });
        new window.Razorpay({
          key: r.keyId, order_id: r.orderId, amount: r.amount, currency: "INR", name: "Arthroscopy College", description: `Application ${r.number}`, prefill: r.prefill, theme: { color: "#0f1526" },
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const c = await confirmApplicationPayment({ token, orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
            setMsg(c.ok ? { ok: true, text: "" } : { ok: false, text: c.error });
          },
        }).open();
      })} className="h-13 w-full rounded-full bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-brand disabled:opacity-50">{pending ? "Opening secure payment…" : label}</button>
      {msg && !msg.ok && <p role="alert" className="mt-3 text-[14px] text-[#d4351c]">{msg.text}</p>}

      <AnimatePresence>
        {test && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div role="dialog" aria-modal="true" aria-label="Test checkout" className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white shadow-2xl" initial={{ y: 20, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20 }}>
              <div className="bg-[#fff4d6] px-5 py-2 text-center text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6b4e00]">Test mode · no real money</div>
              <div className="p-6">
                <p className="text-[13px] text-ink/50">Arthroscopy College · {test.number}</p>
                <p className="mt-1 text-[32px] font-semibold tracking-[-0.03em]">{inr(test.amount)}</p>
                <p className="mt-3 text-[14px] text-ink/60">Razorpay keys aren&apos;t set yet, so this simulates checkout. Add keys in Admin → Settings → Payments to take real payments.</p>
                <div className="mt-6 space-y-2">
                  <button disabled={pending} onClick={() => finishTest("success")} className="h-12 w-full rounded-full bg-[#0c7a43] text-[14px] font-semibold text-white disabled:opacity-50">Simulate successful payment</button>
                  <button disabled={pending} onClick={() => finishTest("failed")} className="h-12 w-full rounded-full border border-ink/15 text-[14px] font-semibold">Simulate failure</button>
                  <button onClick={() => setTest(null)} className="h-10 w-full text-[13px] text-ink/50 hover:text-ink">Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
