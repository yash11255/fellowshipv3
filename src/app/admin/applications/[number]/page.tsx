import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, dateTime, inr } from "@/components/admin/ui";
import { getProgramBySlug } from "@/lib/program-store";
import { getAllSlots, seatsLeft } from "@/lib/slots";
import { ApplicationDecision, type SlotOption } from "@/components/admin/application-decision";
import { ReleaseSeatButton } from "@/components/admin/release-seat-button";
import { STATUS_BADGE } from "@/lib/application-status";
import { STATUS_LABEL, totalOf } from "@/lib/fee-math";
import { paymentsFor } from "@/lib/invoices";

export default async function Application({ params }: PageProps<"/admin/applications/[number]">) {
  await connection();
  await requireStaff("support");
  const { number } = await params;
  const [a] = await (await db()).select().from(schema.applications).where(eq(schema.applications.number, number)).limit(1);
  if (!a) notFound();
  const p = await getProgramBySlug(a.programSlug);
  const slotRows = await getAllSlots(a.programSlug);
  const slots: SlotOption[] = slotRows.map((s) => ({ id: s.id, label: s.label, startDate: s.startDate.toISOString(), seatsLeft: seatsLeft(s), capacity: s.capacity, status: s.status }));
  const total = totalOf(a);
  const balance = total - a.amountPaid;
  const payments = await paymentsFor(a.id);
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
        <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${STATUS_BADGE[a.status]}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
        <span className="text-[13px] text-grey">{p?.title} · applied {dateTime(a.createdAt)}</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Candidate"><dl className="divide-y divide-[#f0f0f0] text-[13px]">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">{k}</dt><dd>{v}</dd></div>)}</dl></Card>
          {a.message && <Card title="Message"><p className="whitespace-pre-line p-4 text-[13px]">{a.message}</p></Card>}
          {(a.feeAmount || a.paidAt) && (
            <Card title="Payment">
              <div className="p-4">
                {a.status === "enrolled" && a.amountPaid >= total ? (
                  <p className="rounded-lg bg-[#cdfee1] px-3 py-2 text-[13px] font-semibold text-[#0c5132]">✓ Payment captured in full · candidate enrolled</p>
                ) : a.status === "paid" ? (
                  <p className="rounded-lg bg-[#fff1d6] px-3 py-2 text-[13px] font-semibold text-[#5e4200]">Deposit captured · seat reserved · balance {inr(balance)} pending</p>
                ) : a.status === "accepted" ? (
                  <p className="rounded-lg bg-[#e9e3ff] px-3 py-2 text-[13px] font-semibold text-[#3b2a86]">Payment link sent · waiting for the candidate to pay {inr(a.payNow ?? 0)}</p>
                ) : null}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ececec]"><div className="h-full rounded-full bg-[#0c7a43]" style={{ width: `${total ? Math.min(100, (a.amountPaid / total) * 100) : 0}%` }} /></div>
                <p className="mt-1 text-[12px] text-grey">{inr(a.amountPaid)} of {inr(total)} received</p>
              </div>
              <dl className="divide-y divide-[#f0f0f0] border-t border-[#f0f0f0] text-[13px]">
                <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Programme fee</dt><dd>{inr(total - Math.round(total - total / (1 + a.gstRate / 100)))} + {a.gstRate}% GST {inr(Math.round(total - total / (1 + a.gstRate / 100)))} = <strong>{inr(total)}</strong>{a.feeIncludesGst ? " (GST included in the fee)" : ""}</dd></div>
                {balance > 0 && a.status === "paid" && <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Balance due</dt><dd className="font-medium text-[#8a5a00]">{inr(balance)}{a.balanceDueAt ? ` by ${dateTime(a.balanceDueAt)}. The seat auto-releases after this if unpaid.` : ""}</dd></div>}
                {a.status === "accepted" && <div className="grid grid-cols-[160px_1fr] px-4 py-2.5"><dt className="text-grey">Payable via link</dt><dd>{inr(a.payNow ?? 0)}</dd></div>}
              </dl>
              {payments.length > 0 && (
                <div className="border-t border-[#f0f0f0]">
                  <p className="px-4 pt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-grey">Payments &amp; invoices</p>
                  <table className="w-full text-[13px]"><tbody>
                    {payments.map((x) => (
                      <tr key={x.id} className="border-b border-[#f6f6f6] last:border-0">
                        <td className="px-4 py-2.5"><span className="font-medium capitalize">{x.kind}</span><span className="block text-[12px] text-grey">{dateTime(x.createdAt)} · {x.paymentId}</span></td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{inr(x.amount)}<span className="block text-[12px] text-grey">incl. GST {inr(x.gst)}</span></td>
                        <td className="px-4 py-2.5 text-right"><a href={`/pay/${a.paymentToken}/invoice/${x.id}`} target="_blank" rel="noreferrer" className="text-[#005bd3] hover:underline">{x.invoiceNo} ↗</a></td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              )}
              {a.slotId && a.amountPaid > 0 && (a.status === "paid" || a.status === "enrolled") && <div className="border-t border-[#f0f0f0] p-4"><ReleaseSeatButton id={a.id} /></div>}
            </Card>
          )}
        </div>
        <Card title="Decision"><ApplicationDecision id={a.id} status={a.status} defaultFee={defaultFee} deposit={p?.deposit ?? 100} cohort={a.cohort ?? ""} note={a.staffNote ?? ""} payLink={a.paymentToken ? `${base}/pay/${a.paymentToken}` : null} slots={slots} slotId={a.slotId} feeIncludesGst={a.feeIncludesGst} /></Card>
      </div>
    </>
  );
}
