import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { inr } from "@/lib/programs";
import { totalOf } from "@/lib/fee-math";
import { getProgramBySlug } from "@/lib/program-store";
import { PayButton } from "@/components/apply/pay-button";
import { paymentsFor } from "@/lib/invoices";

export const metadata: Metadata = { title: "Pay fee", robots: { index: false } };

async function Pay({ params }: { params: PageProps<"/pay/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!/^[\w-]{16,64}$/.test(token)) notFound();
  const [a] = await (await db()).select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a) notFound();
  const p = await getProgramBySlug(a.programSlug);
  const total = totalOf(a);
  const balanceStage = a.status === "paid" && a.amountPaid < total;
  const fullyPaid = (a.status === "paid" || a.status === "enrolled") && a.amountPaid >= total;
  const payments = await paymentsFor(a.id);
  const gstAmt = total - Math.round(total / (1 + a.gstRate / 100));
  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-ink/10 p-6 sm:p-10">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-brand">Application {a.number}</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em]">{fullyPaid || a.status === "enrolled" ? "Seat confirmed" : balanceStage ? "Pay your balance" : "Confirm your seat"}</h1>
      <p className="mt-2 text-ink/60">{p?.title}{a.cohort ? ` · ${a.cohort} batch` : ""}</p>
      <dl className="mt-8 divide-y divide-ink/10 border-y border-ink/10 text-[15px]">
        <div className="flex justify-between py-3"><dt>Candidate</dt><dd className="font-semibold">{a.name}</dd></div>
        <div className="flex justify-between py-3"><dt>Programme fee</dt><dd>{inr(total - gstAmt)}</dd></div>
        <div className="flex justify-between py-3"><dt>GST ({a.gstRate}%){a.feeIncludesGst ? " · included" : ""}</dt><dd>{inr(gstAmt)}</dd></div>
        <div className="flex justify-between py-3 font-semibold"><dt>Total</dt><dd>{inr(total)}</dd></div>
        {a.amountPaid > 0 && <div className="flex justify-between py-3"><dt>Already paid</dt><dd>{inr(a.amountPaid)}</dd></div>}
        <div className="flex justify-between py-3 text-[18px] font-semibold"><dt>{balanceStage ? "Balance due now" : a.payNow && a.payNow < total ? "Payable now (booking amount)" : "Payable now"}</dt><dd>{inr(a.payNow ?? 0)}</dd></div>
      </dl>
      <div className="mt-8">
        {a.status === "accepted" || balanceStage ? (
          <>
            {balanceStage && a.balanceDueAt && <p className="mb-4 rounded-2xl bg-[#fff1d6] p-3 text-[13px] text-[#5e4200]">Pay by {a.balanceDueAt.toLocaleDateString("en-IN")} — after that your seat is released to the next applicant.</p>}
            <PayButton token={token} label={balanceStage ? `Pay balance ${inr(a.payNow ?? 0)} securely` : `Pay ${inr(a.payNow ?? 0)} securely`} />
          </>
        ) : fullyPaid || a.status === "enrolled" ? <div className="rounded-2xl bg-[#e6f6ec] p-4 text-[#0c5132]"><p className="text-[17px] font-semibold">✓ Payment captured. You&apos;re enrolled.</p><p className="mt-1 text-[14px]">Paid in full{a.paidAt ? ` on ${a.paidAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}. Our coordinator will share joining details.</p></div>
          : <p className="rounded-2xl bg-mist p-4">This payment link isn&apos;t active. Please contact +91 96506 20870.</p>}
      </div>
      {payments.length > 0 && (
        <div className="mt-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/45">Your invoices</p>
          <ul className="mt-2 divide-y divide-ink/10 rounded-2xl border border-ink/10">
            {payments.map((x) => <li key={x.id}><a href={`/pay/${token}/invoice/${x.id}`} className="flex items-center justify-between px-4 py-3 text-[14px] hover:bg-mist"><span><span className="font-medium capitalize">{x.kind} payment</span><span className="block text-[12px] text-ink/50">{x.invoiceNo} · {x.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</span></span><span className="font-semibold">{inr(x.amount)} →</span></a></li>)}
          </ul>
        </div>
      )}
      <p className="mt-6 text-[13px] text-ink/50">Payments are processed by Razorpay (UPI, cards, netbanking). A GST invoice is emailed after payment.</p>
    </div>
  );
}

export default function Page({ params }: PageProps<"/pay/[token]">) {
  return <div className="page py-10 text-ink md:py-16"><Suspense fallback={<div className="min-h-[50vh]" />}><Pay params={params} /></Suspense></div>;
}
