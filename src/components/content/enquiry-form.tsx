"use client";

import { useState, useTransition } from "react";
import { submitEnquiry } from "@/lib/enquiry-actions";

const TOPICS = ["Fellowship in Arthroscopy", "Next-Gen ACL Course", "Physiotherapy Internship", "ACL Rehab Workshop", "Online Fellowship", "Appointment with Dr. Bora", "Something else"];

/** Contact form → enquiries table + team email. Rounded college styling. */
export function EnquiryForm({ dark }: { kind?: "contact"; dark?: boolean }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  if (msg?.ok) return (
    <div className={`rounded-[24px] p-8 ${dark ? "bg-white/10" : "bg-mist"}`} role="status">
      <p className="text-[22px] font-semibold tracking-[-0.02em]">Message sent</p>
      <p className={`mt-2 ${dark ? "text-white/70" : "text-ink/65"}`}>Thanks for writing in. Our team replies within one working day, usually sooner on WhatsApp.</p>
    </div>
  );
  const field = `mt-1.5 h-12 w-full rounded-2xl border px-4 text-[15px] outline-none transition-colors ${dark ? "border-white/15 bg-white/5 text-white focus:border-white" : "border-ink/15 bg-white focus:border-ink"}`;
  const label = `text-[13px] font-medium ${dark ? "text-white/80" : ""}`;
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "");
      start(async () => {
        const r = await submitEnquiry({ kind: "contact", name: g("name"), email: g("email"), phone: g("phone"), service: g("service") || undefined, message: g("message"), website: g("website") });
        setMsg(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error });
      });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={label}>Full name</span><input name="name" required autoComplete="name" className={field} /></label>
        <label className="block"><span className={label}>Mobile</span><input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" className={field} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className={label}>Email</span><input name="email" type="email" required autoComplete="email" className={field} /></label>
        <label className="block"><span className={label}>About</span>
          <select name="service" defaultValue={TOPICS[0]} className={field}>{TOPICS.map((t) => <option key={t} className="text-ink">{t}</option>)}</select>
        </label>
      </div>
      <label className="block"><span className={label}>Message</span>
        <textarea name="message" rows={4} required className={`${field} h-auto py-3`} />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {msg && !msg.ok && <p role="alert" className="text-[14px] text-[#d4351c]">{msg.text}</p>}
      <button disabled={pending} className={`inline-flex h-12 items-center rounded-full px-7 text-[15px] font-semibold transition-colors disabled:opacity-50 ${dark ? "bg-teal text-ink" : "bg-ink text-white hover:bg-brand"}`}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
