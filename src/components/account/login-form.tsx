"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { checkCode, savePassword, sendCode, signInWithPassword } from "@/lib/auth-actions";

const TEST_ACCOUNTS = [
  { email: "admin@arthroscopycollege.test", label: "Admin", sub: "Opens the admin panel" },
  { email: "student@arthroscopycollege.test", label: "Student", sub: "Applications dashboard" },
];

/**
 * Modes:
 *  signin  – email + password (default)
 *  otp     – sign in with an emailed code (no password needed)
 *  signup  – verify email with a code, then set a password
 *  forgot  – emailed code, then set a new password
 * After a code is verified in signup/forgot (or otp for an account with no password) the user sets a password.
 */
type Mode = "signin" | "otp" | "signup" | "forgot";
type Step = "email" | "code" | "password";

const TITLES: Record<Mode, [string, string]> = {
  signin: ["Sign in", "Use your email and password."],
  otp: ["Sign in with a code", "We'll email you a one-time code. No password needed."],
  signup: ["Create your account", "Verify your email with a code, then choose a password."],
  forgot: ["Reset your password", "We'll email you a code to set a new password."],
};

export function LoginForm({ next, dev, initialEmail = "" }: { next: string; dev: boolean; initialEmail?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [show, setShow] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  const go = (m: Mode) => { setMode(m); setStep("email"); setError(""); setPassword(""); setPassword2(""); };
  const done = () => { router.replace(next); router.refresh(); };

  const request = (addr: string, m: Mode = mode) => {
    setError("");
    start(async () => {
      const r = await sendCode(addr, m === "signup" ? "signup" : m === "forgot" ? "reset" : "signin");
      if (!r.ok) return setError(r.error);
      setEmail(addr); setStep("code"); setDevCode(r.devCode); setDigits(["", "", "", "", "", ""]);
      setTimeout(() => boxes.current[0]?.focus(), 50);
    });
  };
  const verify = (c = code) => {
    if (c.length !== 6) return;
    setError("");
    start(async () => {
      const r = await checkCode(email, c);
      if (!r.ok) { setError(r.error); setDigits(["", "", "", "", "", ""]); boxes.current[0]?.focus(); return; }
      if (mode === "signup" || mode === "forgot" || !r.hasPassword) { setStep("password"); return; }
      done();
    });
  };
  const signIn = () => {
    setError("");
    start(async () => {
      const r = await signInWithPassword(email, password);
      if (!r.ok) return setError(r.error);
      done();
    });
  };
  const setPw = () => {
    setError("");
    if (password !== password2) return setError("Passwords don't match.");
    start(async () => {
      const r = await savePassword(password);
      if (!r.ok) return setError(r.error);
      done();
    });
  };
  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) { // paste
      const arr = clean.slice(0, 6).split("");
      setDigits([...arr, ...Array(6 - arr.length).fill("")]); boxes.current[Math.min(arr.length, 5)]?.focus();
      if (arr.length === 6) verify(arr.join(""));
      return;
    }
    const d = [...digits]; d[i] = clean; setDigits(d);
    if (clean && i < 5) boxes.current[i + 1]?.focus();
    if (d.join("").length === 6) verify(d.join(""));
  };

  const btn = "h-13 w-full rounded-full bg-ink text-[15px] font-semibold text-white transition-colors hover:bg-brand disabled:opacity-50";
  const field = "mt-1.5 h-13 w-full rounded-2xl border border-ink/15 px-4 text-[15px] outline-none transition-colors focus:border-ink";
  const link = "font-semibold text-ink underline-offset-4 hover:underline";
  const h2 = "text-[clamp(1.75rem,1.4rem+1vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em]";
  const err = error ? <p role="alert" className="mt-3 text-[13px] text-[#d4351c]">{error}</p> : null;

  // ── Set password (after signup / reset / first code sign-in) ──
  if (step === "password") return (
    <div>
      <h2 className={h2}>{mode === "forgot" ? "Choose a new password" : "Set a password"}</h2>
      <p className="mt-2 text-ink/60">{mode === "signup" ? "Email verified. " : ""}Next time you can sign in with {email} and this password.</p>
      <form onSubmit={(e) => { e.preventDefault(); setPw(); }} className="mt-8 space-y-4">
        <label className="block"><span className="text-[13px] font-medium">New password</span>
          <input type={show ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        <label className="block"><span className="text-[13px] font-medium">Confirm password</span>
          <input type={show ? "text" : "password"} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} className={field} />
        </label>
        <label className="flex items-center gap-2 text-[13px] text-ink/60"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[#0f1526]" /> Show password</label>
        <p className="text-[12px] text-ink/50">At least 8 characters, with letters and a number.</p>
        {err}
        <button disabled={pending || !password} className={btn}>{pending ? "Saving…" : "Save password and continue"}</button>
      </form>
      {mode !== "forgot" && <button type="button" onClick={done} className="mt-4 w-full text-center text-[13px] text-ink/50 hover:text-ink">Skip for now</button>}
    </div>
  );

  // ── Enter code ──
  if (step === "code") return (
    <div>
      <button onClick={() => { setStep("email"); setError(""); }} className="mb-6 text-[13px] text-ink/50 hover:text-ink">← {email}</button>
      <h2 className={h2}>Enter your code</h2>
      <p className="mt-2 text-ink/60">We sent a 6-digit code to {email}.</p>
      {devCode && (
        <div className="mt-5 rounded-2xl border border-dashed border-[#b98400] bg-[#fff8e1] px-4 py-3 text-[13px]">
          <span className="font-semibold">Development mode:</span> your code is <button type="button" className="font-mono text-[15px] font-semibold underline" onClick={() => setDigit(0, devCode)}>{devCode}</button>
          <span className="block text-[12px] text-ink/50">Click it to fill. Once a mail server is set up, codes are only emailed.</span>
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="mt-6">
        <fieldset className="flex gap-2" aria-label="6-digit code">
          {digits.map((d, i) => (
            <input key={i} ref={(el) => { boxes.current[i] = el; }} value={d} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={6}
              aria-label={`Digit ${i + 1}`} onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus(); }}
              className="h-14 w-full min-w-0 rounded-2xl border border-ink/15 text-center text-[22px] font-semibold outline-none transition-colors focus:border-ink" />
          ))}
        </fieldset>
        {err}
        <button disabled={pending || code.length !== 6} className={`${btn} mt-6`}>{pending ? "Verifying…" : mode === "signup" ? "Verify email" : "Continue"}</button>
      </form>
      <p className="mt-5 text-[13px] text-ink/50">Didn&apos;t get it? Check spam, or <button type="button" disabled={pending} onClick={() => request(email)} className={link}>send a new code</button>.</p>
    </div>
  );

  const onSignInTab = mode !== "signup";
  // ── Email (+ password for sign-in) ──
  return (
    <div>
      <div className="mb-8 flex rounded-full bg-mist p-1 text-[14px] font-medium" role="tablist">
        {(["signin", "signup"] as const).map((m) => {
          const active = m === "signin" ? onSignInTab : !onSignInTab;
          return <button key={m} type="button" role="tab" aria-selected={active} onClick={() => go(m)} className={`h-10 flex-1 rounded-full transition-colors ${active ? "bg-white shadow-sm" : "text-ink/55"}`}>{m === "signin" ? "Sign in" : "Create account"}</button>;
        })}
      </div>
      <h2 className={h2}>{TITLES[mode][0]}</h2>
      <p className="mt-2 text-ink/60">{TITLES[mode][1]}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (mode === "signin") signIn(); else request(email); }} noValidate className="mt-8 space-y-4">
        <label className="block"><span className="text-[13px] font-medium">Email address</span>
          <input type="email" required autoFocus={!initialEmail} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
        </label>
        {mode === "signin" && (
          <div>
            <div className="flex items-center justify-between text-[13px] font-medium"><label htmlFor="pw">Password</label><button type="button" onClick={() => go("forgot")} className="font-normal text-ink/55 hover:text-ink">Forgot password?</button></div>
            <div className="relative">
              <input id="pw" type={show ? "text" : "password"} autoComplete="current-password" autoFocus={!!initialEmail} value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-16`} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 mt-[3px] -translate-y-1/2 text-[12px] font-medium text-ink/50 hover:text-ink">{show ? "Hide" : "Show"}</button>
            </div>
          </div>
        )}
        {err}
        <button disabled={pending || !email || (mode === "signin" && !password)} className={btn}>
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Send verification code" : mode === "forgot" ? "Send reset code" : "Email me a code"}
        </button>
      </form>
      <div className="mt-5 space-y-2 text-center text-[13px] text-ink/55">
        {mode === "signin" && <p><button type="button" onClick={() => go("otp")} className={link}>Sign in with an email code instead</button></p>}
        {(mode === "otp" || mode === "forgot") && <p><button type="button" onClick={() => go("signin")} className={link}>← Back to password sign-in</button></p>}
        {mode === "signup" && <p>Already have an account? <button type="button" onClick={() => go("signin")} className={link}>Sign in</button></p>}
      </div>
      <p className="mt-6 text-[12px] leading-relaxed text-ink/45">By continuing you agree to our terms and privacy policy. We&apos;ll never share your email.</p>

      {dev && (
        <div className="mt-8 border-t border-ink/10 pt-6">
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">Test accounts · development only (code sign-in)</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {TEST_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" disabled={pending} onClick={() => { setMode("otp"); request(a.email, "otp"); }}
                className="rounded-2xl border border-ink/10 px-4 py-3 text-left transition-colors hover:border-ink">
                <span className="block text-[14px] font-semibold">{a.label}</span>
                <span className="block text-[12px] text-ink/50">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
