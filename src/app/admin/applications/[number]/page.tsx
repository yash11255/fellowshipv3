import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, dateTime, inr } from "@/components/admin/ui";
import { getProgram } from "@/lib/programs";
import { ApplicationDecision } from "@/components/admin/application-decision";
import { STATUS_BADGE } from "@/lib/application-status";

export default async function Application({ params }: PageProps<"/admin/applications/[number]">) {
  await connection();
  await requireStaff("support");
  const { number } = await params;
  const [a] = await (await db()).select().from(schema.applications).where(eq(schema.applications.number, number)).limit(1);
  if (!a) notFound();
  const p = getProgram(a.programSlug);
  const intl = !/^india$/i.test(a.country.trim());
  const defaultFee = a.feeAmount ?? (p?.fee.length ? (intl && p.fee[1] ? p.fee[1].amount : p.fee[0].amount) : null);
  const base = process.env.SITE_URL ?? "http://localhost:3200";
  const rows: [string, React.ReactNode][] = [
    ["Email", <a key="e" href={`mailto:${a.email}`} className="text-[#005bd3] hover:underline">{a.email}</a>],
    ["Phone", <a key="p" href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-[#005bd3] hover:underline">{a.phone} (WhatsApp)</a>],
    ["Country", a.country], ["Qualification", a.qualification], ["Institution", a.institution ?? "—"],
    ["Experience", a.experienceYears !== null ? `${a.experienceYears} years` : "—"], ["Preferred start", a.preferredStart ?? "—"],
    ["CV", a.cvLink ? <a key="c" href={a.cvLink} target="_blank" rel="noreferrer" className="text-[#005bd3] hover:underline">Open CV ↗</a> : "Not provided"],
  ];
  return (
    <>
      <Link href="/admin/applications" className="text-[13px] text-grey hover:text-black">← Applications</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{a.number} · {a.name}</h1>
        <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_BADGE[a.status]}`}>{a.status}</span>
        <span className="text-[13px] text-grey">{p?.title} · applied {dateTime(a.createdAt)}</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Candidate"><dl className="divide-y divide-[#f0f0f0] text-[13px]">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">{k}</dt><dd>{v}</dd></div>)}</dl></Card>
          {a.message && <Card title="Message"><p className="whitespace-pre-line p-4 text-[13px]">{a.message}</p></Card>}
          {(a.feeAmount || a.paidAt) && (
            <Card title="Payment"><dl className="divide-y divide-[#f0f0f0] text-[13px]">
              <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Fee</dt><dd>{inr(a.feeAmount ?? 0)} + {a.gstRate}% GST</dd></div>
              <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Payable via link</dt><dd>{inr(a.payNow ?? 0)}</dd></div>
              <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Paid</dt><dd>{a.paidAt ? `${dateTime(a.paidAt)} · ${a.razorpayPaymentId}` : "Not yet"}</dd></div>
            </dl></Card>
          )}
        </div>
        <Card title="Decision"><ApplicationDecision id={a.id} status={a.status} defaultFee={defaultFee} deposit={p?.deposit ?? 100} cohort={a.cohort ?? ""} note={a.staffNote ?? ""} payLink={a.paymentToken ? `${base}/pay/${a.paymentToken}` : null} /></Card>
      </div>
    </>
  );
}
