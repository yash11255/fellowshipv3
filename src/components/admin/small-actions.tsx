"use client";

import { useState, useTransition } from "react";
import { sendRecoveryEmail, setEnquiryHandled } from "@/lib/admin-actions";
import { decideReturn } from "@/lib/returns-actions";
import { btn, btnGhost, input } from "./ui";

export function HandledToggle({ id, handled }: { id: number; handled: boolean }) {
  const [pending, start] = useTransition();
  return <button disabled={pending} className={handled ? btnGhost : btn} onClick={() => start(async () => { await setEnquiryHandled(id, !handled); })}>{handled ? "Reopen" : "Mark handled"}</button>;
}

export function RecoveryActions({ id, link, sent }: { id: number; link: string; sent: boolean }) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={btnGhost} onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? "Copied" : "Copy link"}</button>
      <button disabled={pending} className={btn} onClick={() => start(async () => { const r = await sendRecoveryEmail(id); setMsg(r.ok ? "Sent" : r.error); })}>{sent ? "Send again" : "Email reminder"}</button>
      {msg && <span className="text-[12px] text-grey">{msg}</span>}
    </div>
  );
}

export function ReturnDecision({ id, status, total }: { id: number; status: string; total: number }) {
  const [pending, start] = useTransition();
  const [amount, setAmount] = useState(String(total));
  const [note, setNote] = useState("");
  const act = (s: "approved" | "rejected" | "refunded") => start(async () => { await decideReturn({ id, status: s, refundAmount: s === "refunded" ? Math.max(0, Math.round(Number(amount) || 0)) : null, staffNote: note }); });
  if (status === "refunded" || status === "rejected") return null;
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <input aria-label="Note to customer" placeholder="Note to customer (optional)" className={`${input} max-w-xs`} value={note} onChange={(e) => setNote(e.target.value)} />
      {status === "requested" && <><button disabled={pending} className={btn} onClick={() => act("approved")}>Approve</button><button disabled={pending} className={btnGhost} onClick={() => act("rejected")}>Reject</button></>}
      {status === "approved" && <><input aria-label="Refund amount" inputMode="numeric" className={`${input} w-28`} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} /><button disabled={pending} className={btn} onClick={() => act("refunded")}>Mark refunded</button></>}
    </div>
  );
}
