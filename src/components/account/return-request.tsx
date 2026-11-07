"use client";

import { useState, useTransition } from "react";
import { requestReturn, RETURN_REASONS } from "@/lib/returns-actions";

export function ReturnRequest({ number, token, existing }: { number: string; token?: string; existing?: { status: string; reason: string; staffNote: string | null } | null }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof RETURN_REASONS)[number]>(RETURN_REASONS[0]);
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (existing) {
    const label = { requested: "Return requested: we'll reply within 1–2 working days", approved: "Return approved", rejected: "Return not approved", refunded: "Refund processed" }[existing.status] ?? existing.status;
    return <div className="border border-line p-4 text-[14px]"><p className="font-semibold">{label}</p><p className="small">Reason: {existing.reason}{existing.staffNote ? ` · ${existing.staffNote}` : ""}</p></div>;
  }
  if (msg?.ok) return <p className="bg-tile p-4 text-[14px]">Return requested. We&apos;ll email you within 1–2 working days.</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="text-[13px] underline">Something wrong with your order? Request a return</button>;
  return (
    <form className="space-y-3 border border-line p-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await requestReturn({ number, token, reason, details }); setMsg(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error }); }); }}>
      <p className="text-[14px] font-semibold">Request a return</p>
      <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="h-11 w-full border border-line bg-white px-3 text-[14px]" aria-label="Reason">
        {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Tell us what happened. For damage, reply to our email with a photo." className="w-full border border-line p-3 text-[14px]" aria-label="Details" />
      {msg && !msg.ok && <p role="alert" className="text-[13px] text-sale">{msg.text}</p>}
      <div className="flex gap-3"><button disabled={pending} className="h-10 bg-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-50">Submit</button><button type="button" onClick={() => setOpen(false)} className="text-[13px] underline">Cancel</button></div>
    </form>
  );
}
