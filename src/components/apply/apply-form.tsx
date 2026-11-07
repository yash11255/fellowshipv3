"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { submitApplication } from "@/lib/application-actions";

type Opt = { slug: string; title: string; audience: string };

export function ApplyForm({ programs, initial }: { programs: Opt[]; initial?: string }) {
  const [program, setProgram] = useState(initial ?? programs[0].slug);
  const [err, setErr] = useState<{ msg: string; field?: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fe = (f: string) => (err?.field === f ? err.msg : undefined);

  if (done) return (
    <div className="rounded-[32px] bg-navy p-8 text-white md:p-12">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-teal">Application {done}</p>
      <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.02em]">Thank you, we&apos;ve got it.</h2>
      <p className="mt-3 max-w-[52ch] text-white/75">We&apos;ve emailed a confirmation. Our coordinator will review your application and call you within 2 working days. Sign in with the same email to track its status.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/account" className="inline-flex h-11 items-center rounded-full bg-teal px-6 text-[14px] font-semibold text-ink">Track application</Link><Link href="/programs" className="inline-flex h-11 items-center rounded-full border border-white/30 px-6 text-[14px] font-semibold">Back to programmes</Link></div>
    </div>
  );

  const field = (f: string) => clsx("mt-1.5 h-12 w-full rounded-2xl border bg-white px-4 text-[15px] outline-none transition-colors focus:border-ink", fe(f) ? "border-[#d4351c]" : "border-ink/15");
  const errOf = (f: string) => (fe(f) ? <span className="mt-1 block text-[13px] text-[#d4351c]">{fe(f)}</span> : null);

  return (
    <form noValidate className="space-y-10 rounded-[32px] border border-ink/10 p-5 sm:p-8 md:p-10" onSubmit={(e) => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "").trim();
      setErr(null);
      start(async () => {
        const r = await submitApplication({ programSlug: program, name: g("name"), email: g("email"), phone: g("phone"), country: g("country") || "India", qualification: g("qualification"),
          institution: g("institution"), experienceYears: g("experience") ? Number(g("experience")) : null, preferredStart: g("start"), cvLink: g("cv"), message: g("message"), website: g("website") });
        if (r.ok) { setDone(r.number); window.scrollTo({ top: 0, behavior: "smooth" }); } else setErr({ msg: r.error, field: "field" in r ? r.field : undefined });
      });
    }}>
      <fieldset>
        <legend className="text-[20px] font-semibold tracking-[-0.02em]">1. Choose a program</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {programs.map((p) => (
            <label key={p.slug} className={clsx("flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors", program === p.slug ? "border-ink bg-mist" : "border-ink/15 hover:border-ink/40")}>
              <input type="radio" name="program" value={p.slug} checked={program === p.slug} onChange={() => setProgram(p.slug)} className="mt-1 size-4 accent-[#0f1526]" />
              <span><span className="block text-[15px] font-semibold">{p.title}</span><span className="text-[13px] text-ink/55">{p.audience}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[20px] font-semibold tracking-[-0.02em]">2. About you</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-[13px] font-medium">Full name (as on certificate)</span><input name="name" autoComplete="name" className={field("name")} />{errOf("name")}</label>
          <label className="block"><span className="text-[13px] font-medium">Email</span><input name="email" type="email" autoComplete="email" className={field("email")} />{errOf("email")}</label>
          <label className="block"><span className="text-[13px] font-medium">Phone / WhatsApp (with country code)</span><input name="phone" type="tel" autoComplete="tel" placeholder="+91 98xxxxxxxx" className={field("phone")} />{errOf("phone")}</label>
          <label className="block"><span className="text-[13px] font-medium">Country</span><input name="country" defaultValue="India" autoComplete="country-name" className={field("country")} /></label>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[20px] font-semibold tracking-[-0.02em]">3. Your background</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="text-[13px] font-medium">Highest qualification</span><input name="qualification" placeholder="MS Ortho, DNB, BPT, MPT…" className={field("qualification")} />{errOf("qualification")}</label>
          <label className="block"><span className="text-[13px] font-medium">Current hospital / college</span><input name="institution" className={field("institution")} /></label>
          <label className="block"><span className="text-[13px] font-medium">Years of experience after PG</span><input name="experience" inputMode="numeric" className={field("experienceYears")} />{errOf("experienceYears")}</label>
          <label className="block"><span className="text-[13px] font-medium">Preferred start month</span><input name="start" type="month" className={field("preferredStart")} /></label>
        </div>
        <label className="block"><span className="text-[13px] font-medium">Link to your CV (Google Drive, Dropbox…)</span><input name="cv" type="url" placeholder="https://" className={field("cvLink")} />{errOf("cvLink")}</label>
        <label className="block"><span className="text-[13px] font-medium">Anything else? (optional)</span><textarea name="message" rows={4} placeholder="What do you want to get out of the program?" className="mt-1.5 w-full rounded-2xl border border-ink/15 bg-white p-4 text-[15px] outline-none focus:border-ink" /></label>
      </fieldset>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {err && !err.field && <p role="alert" className="rounded-2xl border border-[#d4351c] p-3 text-[14px] text-[#d4351c]">{err.msg}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="h-13 rounded-full bg-ink px-10 text-[15px] font-semibold text-white transition-colors hover:bg-brand disabled:opacity-50">{pending ? "Submitting…" : "Submit application"}</button>
        <p className="max-w-[44ch] text-[13px] text-ink/55">No payment now. If accepted, you&apos;ll get a secure link to pay the fee and confirm your seat.</p>
      </div>
    </form>
  );
}
