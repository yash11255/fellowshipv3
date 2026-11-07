import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProgram, inr } from "@/lib/programs";
import { PayButton } from "@/components/apply/pay-button";

export const metadata: Metadata = { title: "Pay fee", robots: { index: false } };

async function Pay({ params }: { params: PageProps<"/pay/[token]">["params"] }) {
  await connection();
  const { token } = await params;
  if (!/^[\w-]{16,64}$/.test(token)) notFound();
  const [a] = await (await db()).select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a) notFound();
  const p = getProgram(a.programSlug);
  const total = Math.round((a.feeAmount ?? 0) * (1 + a.gstRate / 100));
  return (
    <div className="mx-auto max-w-xl">
      <p className="label text-brand">Application {a.number}</p>
      <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.03em]">{a.status === "paid" || a.status === "enrolled" ? "Seat confirmed" : "Confirm your seat"}</h1>
      <p className="body mt-2">{p?.title}{a.cohort ? ` · ${a.cohort} batch` : ""}</p>
      <dl className="mt-8 divide-y divide-line border-y border-line text-[15px]">
        <div className="flex justify-between py-3"><dt>Candidate</dt><dd className="font-semibold">{a.name}</dd></div>
        <div className="flex justify-between py-3"><dt>Program fee</dt><dd>{inr(a.feeAmount ?? 0)}</dd></div>
        <div className="flex justify-between py-3"><dt>GST ({a.gstRate}%)</dt><dd>{inr(total - (a.feeAmount ?? 0))}</dd></div>
        <div className="flex justify-between py-3"><dt>Total</dt><dd>{inr(total)}</dd></div>
        <div className="flex justify-between py-3 text-[18px] font-semibold"><dt>{a.payNow && a.payNow < total ? "Payable now (booking amount)" : "Payable now"}</dt><dd>{inr(a.payNow ?? 0)}</dd></div>
      </dl>
      <div className="mt-8">
        {a.status === "accepted" ? <PayButton token={token} label={`Pay ${inr(a.payNow ?? 0)} securely`} />
          : a.status === "paid" || a.status === "enrolled" ? <p className="border border-ok p-4 text-ok">Paid{a.paidAt ? ` on ${a.paidAt.toLocaleDateString("en-IN")}` : ""}. Our coordinator will share joining details.</p>
          : <p className="border border-line p-4">This payment link isn&apos;t active. Please contact +91 96506 20870.</p>}
      </div>
      <p className="small mt-6">Payments are processed by Razorpay (UPI, cards, netbanking). A GST invoice is emailed after payment.</p>
    </div>
  );
}

export default function Page({ params }: PageProps<"/pay/[token]">) {
  return <div className="page pt-12"><Suspense fallback={<div className="min-h-[50vh]" />}><Pay params={params} /></Suspense></div>;
}
