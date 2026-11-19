import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProgramBySlug } from "@/lib/program-store";
import { invoiceModel, invoiceSettings } from "@/lib/invoices";
import { PrintButton } from "@/components/apply/print-button";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

async function Invoice({ params }: { params: PageProps<"/pay/[token]/invoice/[id]">["params"] }) {
  await connection();
  const { token, id } = await params;
  if (!/^[\w-]{16,64}$/.test(token) || !/^\d+$/.test(id)) notFound();
  const d = await db();
  const [a] = await d.select().from(schema.applications).where(eq(schema.applications.paymentToken, token)).limit(1);
  if (!a) notFound();
  const [p] = await d.select().from(schema.applicationPayments).where(and(eq(schema.applicationPayments.id, Number(id)), eq(schema.applicationPayments.applicationId, a.id))).limit(1);
  if (!p) notFound();
  const program = await getProgramBySlug(a.programSlug);
  const m = invoiceModel(a, p, program?.title ?? "Programme fee", await invoiceSettings());
  const row = (k: string, v: string, strong = false) => <div className={`flex justify-between py-1.5 ${strong ? "text-[16px] font-semibold" : "text-ink/70"}`}><dt>{k}</dt><dd className="tabular-nums">{v}</dd></div>;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-[14px] text-ink/60">Use Print, then Save as PDF to download.</p>
        <PrintButton />
      </div>
      <article className="rounded-[24px] border border-ink/10 bg-white p-6 sm:p-10 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
          <div>
            <p className="text-[22px] font-semibold tracking-[-0.02em]">Arthroscopy College</p>
            <p className="mt-1 max-w-[40ch] text-[13px] text-ink/60">{m.seller.name}<br />{m.seller.address}{m.seller.gstin && <><br />GSTIN {m.seller.gstin}</>}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand">{m.title}</p>
            <p className="mt-1 text-[18px] font-semibold">{m.no}</p>
            <p className="text-[13px] text-ink/60">{m.date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </header>
        <section className="grid gap-6 border-b border-ink/10 py-6 sm:grid-cols-2">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">Billed to</p><p className="mt-1 font-semibold">{m.buyer.name}</p><p className="text-[13px] text-ink/60">{m.buyer.email}<br />{m.buyer.phone} · {m.buyer.country}</p></div>
          <div className="sm:text-right"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">Details</p><p className="mt-1 text-[13px] text-ink/60">Application {m.application}<br />Payment ref {m.paymentId}<br />Place of supply: {m.seller.state}</p></div>
        </section>
        <table className="mt-6 w-full text-[14px]">
          <thead><tr className="border-b border-ink/10 text-left text-[11px] uppercase tracking-[0.1em] text-ink/45"><th className="pb-2 font-semibold">Description</th><th className="pb-2 font-semibold">SAC</th><th className="pb-2 text-right font-semibold">Taxable value</th></tr></thead>
          <tbody><tr className="border-b border-ink/10"><td className="py-3 pr-4 font-medium">{m.item}</td><td className="py-3">{m.sac}</td><td className="py-3 text-right tabular-nums">{inr(m.taxable)}</td></tr></tbody>
        </table>
        <dl className="ml-auto mt-4 max-w-xs">
          {row("Taxable value", inr(m.taxable))}
          {m.igst ? row(`IGST ${m.gstRate}%`, inr(m.igst)) : <>{row(`CGST ${m.gstRate / 2}%`, inr(m.cgst))}{row(`SGST ${m.gstRate / 2}%`, inr(m.sgst))}</>}
          <div className="my-1 border-t border-ink/10" />
          {row("Amount paid", inr(m.amount), true)}
        </dl>
        <section className="mt-8 rounded-2xl bg-mist p-4 text-[13px] print:border print:border-ink/10 print:bg-transparent">
          <div className="flex justify-between py-0.5"><span className="text-ink/60">Programme total (incl. GST)</span><span className="tabular-nums">{inr(m.programmeTotal)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-ink/60">Paid to date</span><span className="tabular-nums">{inr(m.paidToDate)}</span></div>
          <div className="flex justify-between py-0.5 font-semibold"><span>Balance remaining</span><span className="tabular-nums">{m.balance ? inr(m.balance) : "Nil, fully paid"}</span></div>
        </section>
        <p className="mt-8 text-[12px] text-ink/45">This is a computer-generated {m.title.toLowerCase()} and does not require a signature.</p>
      </article>
    </div>
  );
}

export default function Page({ params }: PageProps<"/pay/[token]/invoice/[id]">) {
  return <div className="page py-10 text-ink md:py-16 print:py-0"><Suspense fallback={<div className="min-h-[50vh]" />}><Invoice params={params} /></Suspense></div>;
}
