"use client";

import { useState, useTransition } from "react";
import { decideApplication } from "@/lib/application-actions";
import { btn, btnGhost, input } from "./ui";

export type SlotOption = { id: number; label: string; startDate: string; seatsLeft: number; capacity: number; status: string };

export function ApplicationDecision({ id, status, defaultFee, deposit, cohort, note, payLink, slots, slotId }: { id: number; status: string; defaultFee: number | null; deposit: number; cohort: string; note: string; payLink: string | null; slots: SlotOption[]; slotId: number | null }) {
  const [fee, setFee] = useState(defaultFee ? String(defaultFee) : "");
  const [dep, setDep] = useState(String(deposit));
  const [gst, setGst] = useState("18");
  const [c, setC] = useState(cohort);
  const [sid, setSid] = useState<string>(slotId ? String(slotId) : "");
  const [n, setN] = useState(note);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [link, setLink] = useState(payLink);
  const [pending, start] = useTransition();
  const act = (s: "reviewing" | "accepted" | "rejected" | "enrolled" | "withdrawn") => start(async () => {
    if (s === "rejected" && !confirm("Reject and email the applicant?")) return;
    const r = await decideApplication({ id, status: s, feeAmount: fee ? Number(fee) : null, depositPercent: Number(dep) || 100, gstRate: Number(gst), cohort: c, slotId: sid ? Number(sid) : null, staffNote: n });
    setMsg(r.ok ? { ok: true, text: s === "accepted" ? "Accepted, payment link emailed." : "Updated." } : { ok: false, text: r.error });
    if (r.ok && r.payLink) setLink(r.payLink);
  });
  // Always show the currently-assigned slot even if it's since closed/full, so staff can see what's selected.
  const showSlots = slots.some((s) => s.status === "open") || !!slotId;
  return (
    <div className="space-y-3 p-4">
      <div className="grid grid-cols-3 gap-2">
        <label className="block"><span className="text-[12px] font-medium">Fee ₹ (excl. GST)</span><input inputMode="numeric" className={`${input} mt-1`} value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} /></label>
        <label className="block"><span className="text-[12px] font-medium">Pay now %</span><input inputMode="numeric" className={`${input} mt-1`} value={dep} onChange={(e) => setDep(e.target.value.replace(/\D/g, ""))} /></label>
        <label className="block"><span className="text-[12px] font-medium">GST %</span><input inputMode="numeric" className={`${input} mt-1`} value={gst} onChange={(e) => setGst(e.target.value.replace(/\D/g, ""))} /></label>
      </div>
      {showSlots ? (
        <label className="block">
          <span className="text-[12px] font-medium">Batch (seat is claimed once the deposit is paid)</span>
          <select className={`${input} mt-1`} value={sid} onChange={(e) => { setSid(e.target.value); const s = slots.find((x) => String(x.id) === e.target.value); if (s) setC(s.label); }}>
            <option value="">— no batch / confirm later —</option>
            {slots.map((s) => <option key={s.id} value={s.id} disabled={s.status !== "open" && String(s.id) !== sid}>{s.label} · {s.status === "open" ? `${s.seatsLeft} of ${s.capacity} left` : s.status}</option>)}
          </select>
        </label>
      ) : (
        <label className="block"><span className="text-[12px] font-medium">Batch / cohort</span><input className={`${input} mt-1`} placeholder="e.g. Dec 2026" value={c} onChange={(e) => setC(e.target.value)} /></label>
      )}
      <label className="block"><span className="text-[12px] font-medium">Note (included in rejection email)</span><textarea rows={2} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[13px]" value={n} onChange={(e) => setN(e.target.value)} /></label>
      <div className="flex flex-wrap gap-2">
        {status === "new" && <button disabled={pending} className={btnGhost} onClick={() => act("reviewing")}>Mark reviewing</button>}
        {["new", "reviewing"].includes(status) && <button disabled={pending} className={btn} onClick={() => act("accepted")}>Accept & send payment link</button>}
        {status === "accepted" && <button disabled={pending} className={btnGhost} onClick={() => act("accepted")}>Update & resend link</button>}
        {["paid", "accepted"].includes(status) && <button disabled={pending} className={btn} onClick={() => act("enrolled")}>Mark enrolled</button>}
        {!["rejected", "enrolled", "withdrawn"].includes(status) && <button disabled={pending} className="px-2 text-[12px] text-sale hover:underline" onClick={() => act("rejected")}>Reject</button>}
      </div>
      {link && <p className="break-all rounded-lg bg-[#f6f6f7] p-2 text-[12px]">Payment link: <a href={link} target="_blank" rel="noreferrer" className="text-[#005bd3] underline">{link}</a></p>}
      {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
    </div>
  );
}
