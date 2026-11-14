"use client";
import { useState, useTransition } from "react";
import { sendTestEmail } from "@/lib/cms-actions";
import { btn, input } from "./ui";

export function TestEmail({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className={`${input} w-64`} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Send test to" />
      <button className={btn} disabled={pending} onClick={() => start(async () => { const r = await sendTestEmail(to); setMsg(r.ok ? { ok: true, text: "Sent. Check the inbox (and spam)." } : { ok: false, text: r.error }); })}>{pending ? "Sending…" : "Send test email"}</button>
      {msg && <span className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</span>}
    </div>
  );
}
