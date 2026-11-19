"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { decideApplication } from "@/lib/application-actions";
import { feeBreakdown, GATEWAY_GST_PERCENT, GATEWAY_PERCENT } from "@/lib/fee-math";
import { btn, btnGhost, input } from "./ui";

export type SlotOption = { id: number; label: string; startDate: string; seatsLeft: number; capacity: number; status: string };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const PLANS: [string, number][] = [["Full payment", 100], ["50% now", 50], ["30% now", 30]];

function Row({ k, v, strong, minus, plus, hint }: { k: string; v: string; strong?: boolean; minus?: boolean; plus?: boolean; hint?: string }) {
  return (
    <div className={clsx("flex items-baseline justify-between gap-3 py-1.5", strong && "font-semibold")}>
      <dt className={clsx(!strong && "text-[#4a4a4a]")}>{k}{hint && <span className="block text-[11px] font-normal text-[#8a8a8a]">{hint}</span>}</dt>
      <dd className={clsx("tabular-nums", minus && "text-[#b42318]")}>{minus ? "− " : plus ? "+ " : ""}{v}</dd>
    </div>
  );
}

export function ApplicationDecision({ id, status, defaultFee, deposit, cohort, note, payLink, slots, slotId, balanceDays, feeIncludesGst }: { feeIncludesGst?: boolean; id: number; status: string; defaultFee: number | null; deposit: number; cohort: string; note: string; payLink: string | null; slots: SlotOption[]; slotId: number | null; balanceDays?: number }) {
  const [fee, setFee] = useState(defaultFee ? String(defaultFee) : "");
  const [dep, setDep] = useState(String(deposit || 100));
  const [custom, setCustom] = useState(!PLANS.some(([, p]) => p === (deposit || 100)));
  const [gst, setGst] = useState("18");
  const [incl, setIncl] = useState(!!feeIncludesGst);
  const [c, setC] = useState(cohort);
  const [sid, setSid] = useState<string>(slotId ? String(slotId) : "");
  const [n, setN] = useState(note);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState(payLink);
  const [pending, start] = useTransition();

  const b = feeBreakdown(Number(fee) || 0, Number(gst) || 0, Number(dep) || 100, incl);
  const split = b.payNowPercent < 100;
  const slot = slots.find((s) => String(s.id) === sid);
  const dueDays = slot ? undefined : balanceDays; // per-batch deadline is set on the batch itself
  const editable = ["new", "reviewing", "accepted"].includes(status);

  const act = (s: "reviewing" | "accepted" | "rejected" | "enrolled" | "withdrawn") => start(async () => {
    if (s === "rejected" && !confirm("Reject and email the applicant?")) return;
    if (s === "enrolled" && !confirm("Mark enrolled manually? Only do this if the candidate paid outside the website (cash / bank transfer).")) return;
    const r = await decideApplication({ id, status: s, feeAmount: fee ? Number(fee) : null, depositPercent: b.payNowPercent, feeIncludesGst: incl, gstRate: Number(gst), cohort: c, slotId: sid ? Number(sid) : null, staffNote: n });
    setMsg(r.ok ? { ok: true, text: s === "accepted" ? `Payment link for ${inr(b.payNow)} emailed to the candidate.` : "Updated." } : { ok: false, text: r.error });
    if (r.ok && r.payLink) setLink(r.payLink);
  });
  const showSlots = slots.some((s) => s.status === "open") || !!slotId;

  return (
    <div className="space-y-5 p-4 text-[13px]">
      {editable && (
        <>
          {/* Step 1: price */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">1 · Programme fee</p>
            <div className="mt-2 grid grid-cols-[1fr_110px] gap-2">
              <label className="block"><span className="text-[12px] font-medium">{incl ? "Fee in ₹ (GST included)" : "Fee in ₹ (before GST)"}</span><input inputMode="numeric" placeholder="e.g. 10000" className={`${input} mt-1`} value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} /></label>
              <label className="block"><span className="text-[12px] font-medium">GST</span>
                <select className={`${input} mt-1`} value={gst} onChange={(e) => setGst(e.target.value)}>
                  {["18", "12", "5", "0"].map((g) => <option key={g} value={g}>{g}%</option>)}
                </select>
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-[#f1f1f1] p-1" role="radiogroup" aria-label="Does the fee include GST?">
              {([[false, "GST is added on top"], [true, "Fee already includes GST"]] as const).map(([v, label]) => (
                <button key={label} type="button" role="radio" aria-checked={incl === v} onClick={() => setIncl(v)}
                  className={clsx("rounded-md px-2 py-1.5 text-[12px] font-medium", incl === v ? "bg-white shadow-sm" : "text-[#6b6b6b] hover:text-black")}>{label}</button>
              ))}
            </div>
            {b.fee > 0 && b.gstRate > 0 && (
              <p className="mt-2 rounded-lg bg-[#eef6ff] px-3 py-2 text-[12px] text-[#00376b]">
                {incl
                  ? <><strong>{inr(b.gst)}</strong> GST ({b.gstRate}%) is already inside {inr(b.total)}. The invoice will show {inr(b.fee)} fee + {inr(b.gst)} GST. The candidate pays exactly <strong>{inr(b.total)}</strong>.</>
                  : <><strong>{inr(b.gst)}</strong> GST ({b.gstRate}%) is added on top of {inr(b.fee)}. The candidate pays <strong>{inr(b.total)}</strong>.</>}
              </p>
            )}
          </section>

          {/* Step 2: plan */}
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">2 · How will the candidate pay?</p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Payment plan">
              {PLANS.map(([label, p]) => (
                <button key={p} type="button" role="radio" aria-checked={!custom && b.payNowPercent === p} onClick={() => { setCustom(false); setDep(String(p)); }}
                  className={clsx("rounded-full border px-3 py-1.5 text-[12px] font-medium", !custom && b.payNowPercent === p ? "border-black bg-black text-white" : "border-[#d4d4d4] hover:border-black")}>{label}</button>
              ))}
              <button type="button" role="radio" aria-checked={custom} onClick={() => setCustom(true)} className={clsx("rounded-full border px-3 py-1.5 text-[12px] font-medium", custom ? "border-black bg-black text-white" : "border-[#d4d4d4] hover:border-black")}>Custom %</button>
            </div>
            {custom && <label className="mt-2 flex items-center gap-2"><input inputMode="numeric" className={`${input} w-20`} value={dep} onChange={(e) => setDep(e.target.value.replace(/\D/g, "").slice(0, 3))} /><span>% of the total paid first</span></label>}
          </section>

          {/* Live breakdown */}
          {b.fee > 0 && (
            <section className="overflow-hidden rounded-xl border border-[#e3e3e3]">
              <div className="bg-[#f6f6f7] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">What the candidate pays</p>
                <dl className="mt-1">
                  <Row k="Programme fee" v={inr(b.fee)} />
                  <Row k={`GST (${b.gstRate}%)`} v={inr(b.gst)} plus />
                  <div className="my-1 border-t border-[#dcdcdc]" />
                  <Row k="Total for the candidate" v={inr(b.total)} strong />
                </dl>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/10">
                    <p className="text-[11px] text-[#6b6b6b]">{split ? `Payment link now (${b.payNowPercent}%)` : "Payment link (full amount)"}</p>
                    <p className="text-[18px] font-semibold tabular-nums">{inr(b.payNow)}</p>
                  </div>
                  {split && (
                    <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/10">
                      <p className="text-[11px] text-[#6b6b6b]">Balance later ({100 - b.payNowPercent}%)</p>
                      <p className="text-[18px] font-semibold tabular-nums">{inr(b.balance)}</p>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#4a4a4a]">
                  {split
                    ? <>The candidate gets one link. They pay <strong>{inr(b.payNow)}</strong> first to reserve the seat, then the remaining <strong>{inr(b.balance)}</strong> on the same link{slot ? " within the batch's balance deadline" : dueDays ? ` within ${dueDays} days` : " within 14 days"}. If the balance isn&apos;t paid in time, the seat is released.</>
                    : <>The candidate pays <strong>{inr(b.total)}</strong> in one go and is enrolled automatically.</>}
                </p>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b6b6b]">What you receive (estimate)</p>
                <dl className="mt-1">
                  <Row k="Collected from candidate" v={inr(b.total)} />
                  <Row k="Razorpay fee" hint={`${GATEWAY_PERCENT}% + ${GATEWAY_GST_PERCENT}% GST on the fee · international cards cost more`} v={inr(b.gatewayFee)} minus />
                  <div className="my-1 border-t border-[#ececec]" />
                  <Row k="Lands in your bank" v={inr(b.received)} strong />
                  <Row k={`GST to pay the government (${b.gstRate}%)`} v={inr(b.gst)} minus />
                  <div className="my-1 border-t border-[#ececec]" />
                  <Row k="Your net income" v={inr(b.netIncome)} strong />
                </dl>
              </div>
            </section>
          )}

          {/* Batch */}
          {showSlots ? (
            <label className="block">
              <span className="text-[12px] font-medium">Batch (the seat is held once the first payment arrives)</span>
              <select className={`${input} mt-1`} value={sid} onChange={(e) => { setSid(e.target.value); const s = slots.find((x) => String(x.id) === e.target.value); if (s) setC(s.label); }}>
                <option value="">No batch yet / decide later</option>
                {slots.map((s) => <option key={s.id} value={s.id} disabled={s.status !== "open" && String(s.id) !== sid}>{s.label} · {s.status === "open" ? `${s.seatsLeft} of ${s.capacity} seats left` : s.status}</option>)}
              </select>
            </label>
          ) : (
            <label className="block"><span className="text-[12px] font-medium">Batch / cohort</span><input className={`${input} mt-1`} placeholder="e.g. Dec 2026" value={c} onChange={(e) => setC(e.target.value)} /></label>
          )}
        </>
      )}

      <label className="block"><span className="text-[12px] font-medium">Note for the candidate (only sent if you reject)</span><textarea rows={2} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[13px]" value={n} onChange={(e) => setN(e.target.value)} /></label>

      <div className="flex flex-wrap items-center gap-2">
        {status === "new" && <button disabled={pending} className={btnGhost} onClick={() => act("reviewing")}>Mark reviewing</button>}
        {["new", "reviewing"].includes(status) && <button disabled={pending || !b.fee} className={btn} onClick={() => act("accepted")}>{b.fee ? `Accept & email ${inr(b.payNow)} payment link` : "Enter the fee to accept"}</button>}
        {status === "accepted" && <button disabled={pending || !b.fee} className={btn} onClick={() => act("accepted")}>Save & re-email {inr(b.payNow)} link</button>}
        {["paid", "accepted"].includes(status) && <button disabled={pending} className={btnGhost} onClick={() => act("enrolled")}>Paid offline? Mark enrolled</button>}
        {!["rejected", "enrolled", "withdrawn"].includes(status) && <button disabled={pending} className="px-2 text-[12px] text-sale hover:underline" onClick={() => act("rejected")}>Reject</button>}
      </div>
      {link && ["accepted", "paid"].includes(status) && <p className="break-all rounded-lg bg-[#f6f6f7] p-2 text-[12px]">Candidate&apos;s payment link: <a href={link} target="_blank" rel="noreferrer" className="text-[#005bd3] underline">{link}</a></p>}
      {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
    </div>
  );
}
