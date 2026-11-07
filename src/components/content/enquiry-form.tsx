"use client";

import { useState, useTransition } from "react";
import { submitEnquiry } from "@/lib/enquiry-actions";

export function EnquiryForm({ kind, services = [], defaultService }: { kind: "clinic" | "contact"; services?: { value: string; label: string }[]; defaultService?: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return (
    <div className="bg-tile p-6">
      <p className="hd-3">{kind === "clinic" ? "Request received" : "Message sent"}</p>
      <p className="body mt-2">{kind === "clinic" ? "Our clinic team will call you within one working day to confirm your consultation." : "Thanks for writing in. We usually reply within one working day."}</p>
    </div>
  );
  const field = "mt-1.5 h-12 w-full border border-line bg-white px-3 text-[15px] outline-none focus:border-black";
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "");
      start(async () => {
        const r = await submitEnquiry({ kind, name: g("name"), email: g("email"), phone: g("phone"), service: g("service") || undefined, preferredDate: g("date") || undefined, message: g("message"), website: g("website") });
        setMsg(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error });
      });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-[13px] font-medium">Full name</span><input name="name" required autoComplete="name" className={field} /></label>
        <label className="block"><span className="text-[13px] font-medium">Mobile{kind === "contact" ? " (optional)" : ""}</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel" required={kind === "clinic"} className={field} /></label>
      </div>
      <label className="block"><span className="text-[13px] font-medium">Email</span><input name="email" type="email" required autoComplete="email" className={field} /></label>
      {kind === "clinic" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-[13px] font-medium">Service</span>
            <select name="service" defaultValue={defaultService ?? ""} className={field}>
              <option value="">General consultation</option>
              {services.map((s) => <option key={s.value} value={s.label}>{s.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="text-[13px] font-medium">Preferred date</span><input name="date" type="date" min={today} className={field} /></label>
        </div>
      )}
      <label className="block"><span className="text-[13px] font-medium">{kind === "clinic" ? "What would you like help with? (optional)" : "Message"}</span>
        <textarea name="message" rows={4} required={kind === "contact"} className="mt-1.5 w-full border border-line bg-white p-3 text-[15px] outline-none focus:border-black" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {msg && !msg.ok && <p role="alert" className="text-[13px] text-sale">{msg.text}</p>}
      <button disabled={pending} className="h-13 w-full bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626] disabled:opacity-50 sm:w-auto sm:px-10">
        {pending ? "Sending…" : kind === "clinic" ? "Request consultation" : "Send message"}
      </button>
      <p className="small">We use your details only to respond to this request.</p>
    </form>
  );
}
