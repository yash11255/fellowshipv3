"use client";

import { useState, useTransition } from "react";
import { savePassword } from "@/lib/auth-actions";

export function ChangePassword({ hasPassword }: { hasPassword: boolean }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const field = "h-12 w-full rounded-2xl border border-ink/15 px-4 text-[15px] outline-none focus:border-ink";
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => {
      e.preventDefault(); setMsg(null);
      if (pw !== pw2) return setMsg({ ok: false, text: "Passwords don't match." });
      start(async () => { const r = await savePassword(pw); setMsg(r.ok ? { ok: true, text: "Password saved." } : { ok: false, text: r.error }); if (r.ok) { setPw(""); setPw2(""); } });
    }}>
      <input type="password" autoComplete="new-password" placeholder={hasPassword ? "New password" : "Choose a password"} aria-label="New password" value={pw} onChange={(e) => setPw(e.target.value)} className={field} />
      <input type="password" autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={field} />
      <button disabled={pending || !pw} className="h-12 rounded-full bg-ink px-6 text-[14px] font-semibold text-white disabled:opacity-40">{pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}</button>
      {msg && <p role="status" className={`text-[13px] sm:col-span-3 ${msg.ok ? "text-[#0c7a43]" : "text-[#d4351c]"}`}>{msg.text}</p>}
    </form>
  );
}
