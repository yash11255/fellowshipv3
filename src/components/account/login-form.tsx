"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { checkCode, sendCode } from "@/lib/auth-actions";

const TEST_ACCOUNTS = [
  { email: "admin@arthroscopycollege.test", label: "Admin", sub: "Opens the admin panel" },
  { email: "student@arthroscopycollege.test", label: "Student", sub: "Applications dashboard" },
];

export function LoginForm({ next, dev, initialEmail = "" }: { next: string; dev: boolean; initialEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, start] = useTransition();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  const request = (addr: string) => {
    setError("");
    start(async () => {
      const r = await sendCode(addr);
      if (!r.ok) return setError(r.error);
      setEmail(addr); setStep("code"); setDevCode(r.devCode); setDigits(["", "", "", "", "", ""]);
      setInfo(`We sent a 6-digit code to ${addr}.`);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    });
  };
  const verify = (c = code) => {
    if (c.length !== 6) return;
    setError("");
    start(async () => {
      const r = await checkCode(email, c);
      if (!r.ok) { setError(r.error); setDigits(["", "", "", "", "", ""]); boxes.current[0]?.focus(); return; }
      router.replace(next); router.refresh();
    });
  };
  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) { // paste
      const arr = clean.slice(0, 6).split("");
      const nextDigits = [...arr, ...Array(6 - arr.length).fill("")];
      setDigits(nextDigits); boxes.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) verify(arr.join(""));
      return;
    }
    const d = [...digits]; d[i] = clean; setDigits(d);
    if (clean && i < 5) boxes.current[i + 1]?.focus();
    if (d.join("").length === 6) verify(d.join(""));
  };

  const btn = "h-13 w-full bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-[#262626] disabled:opacity-50";

  if (step === "code") return (
    <div>
      <button onClick={() => { setStep("email"); setError(""); }} className="mb-6 text-[13px] text-grey hover:text-black">← {email}</button>
      <h2 className="hd-2">Enter your code</h2>
      <p className="body mt-2">{info}</p>
      {devCode && (
        <div className="mt-5 border border-dashed border-[#b98400] bg-[#fff8e1] px-4 py-3 text-[13px]">
          <span className="font-semibold">Development mode:</span> your code is <button type="button" className="font-mono text-[15px] font-semibold underline" onClick={() => setDigit(0, devCode)}>{devCode}</button>
          <span className="block text-[12px] text-grey">Click it to fill. In production this is emailed and never shown.</span>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="mt-6">
        <fieldset className="flex gap-2" aria-label="6-digit code">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6}
              aria-label={`Digit ${i + 1}`} onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus(); }}
              className="h-14 w-full min-w-0 border border-line text-center text-[22px] font-semibold outline-none transition-colors focus:border-black" />
          ))}
        </fieldset>
        {error && <p role="alert" className="mt-3 text-[13px] text-sale">{error}</p>}
        <button disabled={pending || code.length !== 6} className={`${btn} mt-6`}>{pending ? "Verifying…" : "Sign in"}</button>
      </form>
      <p className="mt-5 text-[13px] text-grey">Didn&apos;t get it? Check spam, or <button type="button" disabled={pending} onClick={() => request(email)} className="text-black underline">send a new code</button>.</p>
    </div>
  );

  return (
    <div>
      <h2 className="hd-2">Sign in or create an account</h2>
      <p className="body mt-2">No password needed. We&apos;ll email you a one-time code.</p>
      <form onSubmit={(e) => { e.preventDefault(); request(email); }} noValidate className="mt-8">
        <label className="block"><span className="text-[13px] font-medium">Email address</span>
          <input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="mt-1.5 h-13 w-full border border-line px-4 text-[15px] outline-none transition-colors focus:border-black" />
        </label>
        {error && <p role="alert" className="mt-2 text-[13px] text-sale">{error}</p>}
        <button disabled={pending || !email} className={`${btn} mt-5`}>{pending ? "Sending…" : "Continue"}</button>
      </form>
      <p className="mt-6 text-[12px] leading-relaxed text-grey">By continuing you agree to our terms and privacy policy. We&apos;ll never share your email.</p>

      {dev && (
        <div className="mt-10 border-t border-line pt-6">
          <p className="label text-grey">Test accounts · development only</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TEST_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" disabled={pending} onClick={() => request(a.email)}
                className="border border-line px-4 py-3 text-left transition-colors hover:border-black">
                <span className="block text-[14px] font-semibold">{a.label}</span>
                <span className="block text-[12px] text-grey">{a.email}</span>
                <span className="block text-[12px] text-grey">{a.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
