import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { inr } from "@/lib/programs";
import { getProgramBySlug } from "@/lib/program-store";
import { PayButton } from "@/components/apply/pay-button";

export const metadata: Metadata = { title: "Pay fee", robots: { index: false } };

async function Pay({ params }: { params: PageProps<"/pay/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!/^[\w-]{16,64}$/.test(token)) notFound();
  const [a] = await (await db()).select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a) notFound();
  const p = await getProgramBySlug(a.programSlug);
  const total = Math.round((a.feeAmount ?? 0) * (1 + a.gstRate / 100));
  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-ink/10 p-6 sm:p-10">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-brand">Application {a.number}</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em]">{a.status === "paid" || a.status === "enrolled" ? "Seat confirmed" : "Confirm your seat"}</h1>
      <p className="mt-2 text-ink/60">{p?.title}{a.cohort ? ` · ${a.cohort} batch` : ""}</p>
      <dl className="mt-8 divide-y divide-ink/10 border-y border-ink/10 text-[15px]">
        <div className="flex justify-between py-3"><dt>Candidate</dt><dd className="font-semibold">{a.name}</dd></div>
        <div className="flex justify-between py-3"><dt>Program fee</dt><dd>{inr(a.feeAmount ?? 0)}</dd></div>
        <div className="flex justify-between py-3"><dt>GST ({a.gstRate}%)</dt><dd>{inr(total - (a.feeAmount ?? 0))}</dd></div>
        <div className="flex justify-between py-3"><dt>Total</dt><dd>{inr(total)}</dd></div>
        <div className="flex justify-between py-3 text-[18px] font-semibold"><dt>{a.payNow && a.payNow < total ? "Payable now (booking amount)" : "Payable now"}</dt><dd>{inr(a.payNow ?? 0)}</dd></div>
      </dl>
      <div className="mt-8">
        {a.status === "accepted" ? <PayButton token={token} label={`Pay ${inr(a.payNow ?? 0)} securely`} />
          : a.status === "paid" || a.status === "enrolled" ? <p className="rounded-2xl bg-[#e6f6ec] p-4 text-[#0c5132]">Paid{a.paidAt ? ` on ${a.paidAt.toLocaleDateString("en-IN")}` : ""}. Our coordinator will share joining details.</p>
          : <p className="rounded-2xl bg-mist p-4">This payment link isn&apos;t active. Please contact +91 96506 20870.</p>}
      </div>
      <p className="mt-6 text-[13px] text-ink/50">Payments are processed by Razorpay (UPI, cards, netbanking). A GST invoice is emailed after payment.</p>
    </div>
  );
}

export default function Page({ params }: PageProps<"/pay/[token]">) {
  return <div className="page py-10 text-ink md:py-16"><Suspense fallback={<div className="min-h-[50vh]" />}><Pay params={params} /></Suspense></div>;
}
