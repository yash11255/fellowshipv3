"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { BodyMap } from "./body-map";
import { useCart } from "@/components/cart/cart-context";
import { recommend, type Answers, type Flag, type StackProduct } from "@/lib/stack-engine";
import type { Goal } from "@/lib/catalog";

const GOAL_LABELS: Record<Goal, string> = {
  longevity: "Healthy ageing", energy: "Energy", "joints-bones": "Joints & bones", "skin-hair-nails": "Skin, hair & nails",
  gut: "Gut", heart: "Heart", metabolic: "Blood sugar", weight: "Weight", sport: "Muscle & recovery",
  brain: "Focus", "sleep-stress": "Sleep & stress", immunity: "Immunity",
};
const EXTRA_GOALS: Goal[] = ["longevity", "energy", "skin-hair-nails", "metabolic", "weight", "immunity"];
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const STEPS = ["About you", "Your goals", "Lifestyle", "Health check", "Budget"] as const;

function Choice<T extends string>({ value, options, onChange, cols = 2 }: {
  value: T | null; options: { v: T; label: string; sub?: string }[]; onChange: (v: T) => void; cols?: number;
}) {
  return (
    <div className={clsx("grid gap-2", cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")} role="radiogroup">
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}
          className={clsx("flex min-h-16 flex-col items-start justify-center border px-4 py-3 text-left transition-colors",
            value === o.v ? "border-black bg-black text-white" : "border-line hover:border-black")}>
          <span className="text-[15px] font-semibold">{o.label}</span>
          {o.sub && <span className={clsx("text-[12px]", value === o.v ? "text-white/70" : "text-grey")}>{o.sub}</span>}
        </button>
      ))}
    </div>
  );
}

function Q({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div><h3 className="text-[17px] font-semibold">{title}</h3>{hint && <p className="small mt-1">{hint}</p>}</div>
      {children}
    </div>
  );
}

export function StackBuilder({ products }: { products: StackProduct[] }) {
  const reduce = useReducedMotion();
  const { add } = useCart();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>({ age: null, goals: [], activity: null, sleep: null, diet: null, flags: [], budget: 3000 });
  const done = step >= STEPS.length;
  const result = useMemo(() => (done ? recommend(products, a) : null), [done, products, a]);

  const toggleGoal = (g: Goal) =>
    setA((s) => ({ ...s, goals: s.goals.includes(g) ? s.goals.filter((x) => x !== g) : s.goals.length >= 3 ? s.goals : [...s.goals, g] }));
  const toggleFlag = (f: Flag) =>
    setA((s) => ({ ...s, flags: f === "none" ? ["none"] : s.flags.includes(f) ? s.flags.filter((x) => x !== f) : [...s.flags.filter((x) => x !== "none"), f] }));

  const canNext = [
    !!a.age,
    a.goals.length > 0,
    !!a.activity && !!a.sleep && !!a.diet,
    a.flags.length > 0,
    true,
  ][step];

  const go = (d: number) => { setDir(d); setStep((s) => Math.max(0, s + d)); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); };
  const restart = () => { setA({ age: null, goals: [], activity: null, sleep: null, diet: null, flags: [], budget: 3000 }); setDir(-1); setStep(0); };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -40 }),
  };

  return (
    <div className="page pb-10 pt-8 md:pt-12">
      {/* progress */}
      {!done && (
        <div>
          <div className="flex items-center justify-between">
            <p className="label">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
            {step > 0 && <button onClick={() => go(-1)} className="label hover:underline">← Back</button>}
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => <div key={s} className={clsx("h-[3px] transition-colors duration-500", i <= step ? "bg-black" : "bg-line")} />)}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={done ? "result" : step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mt-10">

          {step === 0 && (
            <div className="mx-auto max-w-2xl space-y-10">
              <div><h1 className="hd-1">Find your stack</h1><p className="body mt-3">Five quick questions. We&apos;ll suggest up to three formulas and explain every pick.</p></div>
              <Q title="How old are you?">
                <Choice value={a.age} onChange={(v) => setA((s) => ({ ...s, age: v }))} cols={4}
                  options={[{ v: "u30", label: "Under 30" }, { v: "30-44", label: "30–44" }, { v: "45-59", label: "45–59" }, { v: "60+", label: "60+" }]} />
              </Q>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="order-2 h-[380px] bg-tile py-6 md:h-[480px] lg:order-1">
                <BodyMap selected={a.goals} onToggle={toggleGoal} />
              </div>
              <div className="order-1 space-y-6 lg:order-2">
                <div>
                  <h2 className="hd-2">What would you like to improve?</h2>
                  <p className="body mt-2">Pick up to 3, in order of priority. Tap the body or choose below.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([...EXTRA_GOALS, "brain", "sleep-stress", "heart", "gut", "sport", "joints-bones"] as Goal[]).map((g) => {
                    const i = a.goals.indexOf(g);
                    const full = a.goals.length >= 3 && i < 0;
                    return (
                      <button key={g} onClick={() => toggleGoal(g)} disabled={full} aria-pressed={i >= 0}
                        className={clsx("inline-flex h-10 items-center gap-2 border px-4 text-[14px] font-medium transition-colors disabled:opacity-35",
                          i >= 0 ? "border-black bg-black text-white" : "border-line hover:border-black")}>
                        {i >= 0 && <span className="grid size-5 place-items-center rounded-full bg-white text-[11px] font-semibold text-black">{i + 1}</span>}
                        {GOAL_LABELS[g]}
                      </button>
                    );
                  })}
                </div>
                <p className="small">{a.goals.length}/3 selected</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mx-auto max-w-2xl space-y-10">
              <h2 className="hd-2">A little about your routine</h2>
              <Q title="How active are you?">
                <Choice value={a.activity} onChange={(v) => setA((s) => ({ ...s, activity: v }))} cols={3}
                  options={[{ v: "low", label: "Mostly sitting" }, { v: "moderate", label: "Active", sub: "2–3 workouts/week" }, { v: "athlete", label: "Training hard", sub: "4+ sessions/week" }]} />
              </Q>
              <Q title="How do you sleep?">
                <Choice value={a.sleep} onChange={(v) => setA((s) => ({ ...s, sleep: v }))} cols={3}
                  options={[{ v: "poor", label: "Poorly" }, { v: "ok", label: "It's okay" }, { v: "good", label: "Well" }]} />
              </Q>
              <Q title="Your diet">
                <Choice value={a.diet} onChange={(v) => setA((s) => ({ ...s, diet: v }))} cols={3}
                  options={[{ v: "veg", label: "Vegetarian" }, { v: "nonveg", label: "Non-veg" }, { v: "vegan", label: "Vegan" }]} />
              </Q>
            </div>
          )}

          {step === 3 && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div><h2 className="hd-2">Anything we should know?</h2><p className="body mt-2">We&apos;ll leave out formulas that may not suit you. Select all that apply.</p></div>
              <div className="grid gap-2">
                {([["pregnant", "Pregnant or breastfeeding"], ["blood-thinners", "Taking blood thinners", "e.g. warfarin, aspirin daily"],
                  ["diabetes-meds", "Taking diabetes medication"], ["bp-meds", "Taking blood-pressure medication"], ["none", "None of these"]] as [Flag, string, string?][]).map(([f, l, sub]) => {
                  const on = a.flags.includes(f);
                  return (
                    <button key={f} onClick={() => toggleFlag(f)} aria-pressed={on}
                      className={clsx("flex items-center gap-4 border px-4 py-4 text-left transition-colors", on ? "border-black" : "border-line hover:border-black")}>
                      <span className={clsx("grid size-5 shrink-0 place-items-center border", on ? "border-black bg-black text-white" : "border-mute")}>
                        {on && <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>}
                      </span>
                      <span><span className="block text-[15px] font-semibold">{l}</span>{sub && <span className="small">{sub}</span>}</span>
                    </button>
                  );
                })}
              </div>
              <p className="small">This isn&apos;t medical advice. If you have a condition or take regular medication, check with your doctor.</p>
            </div>
          )}

          {step === 4 && (
            <div className="mx-auto max-w-2xl space-y-8">
              <div><h2 className="hd-2">Monthly budget</h2><p className="body mt-2">We&apos;ll keep your stack within this. You can always add more later.</p></div>
              <div>
                <p className="text-[40px] font-semibold tracking-[-0.03em]">{inr(a.budget)}<span className="text-[16px] font-normal text-grey"> / month</span></p>
                <input type="range" min={1000} max={6000} step={250} value={a.budget} onChange={(e) => setA((s) => ({ ...s, budget: +e.target.value }))}
                  aria-label="Monthly budget" className="mt-6 w-full accent-black" />
                <div className="mt-1 flex justify-between text-[12px] text-grey"><span>₹1,000</span><span>₹6,000</span></div>
              </div>
            </div>
          )}

          {done && result && (
            <Results result={result} answers={a} onRestart={restart} onAddAll={(items) => items.forEach((p) => add({ handle: p.handle, title: p.title, image: p.image, months: 1, price: p.price, compareAt: p.compareAt }))} />
          )}
        </motion.div>
      </AnimatePresence>

      {!done && (
        <div className="mx-auto mt-12 flex max-w-2xl justify-end border-t border-line pt-6 lg:max-w-none">
          <button onClick={() => go(1)} disabled={!canNext}
            className="h-13 bg-black px-10 text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626] disabled:bg-tile disabled:text-mute">
            {step === STEPS.length - 1 ? "See my stack" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

function Results({ result, answers, onRestart, onAddAll }: {
  result: NonNullable<ReturnType<typeof recommend>>; answers: Answers; onRestart: () => void; onAddAll: (p: StackProduct[]) => void;
}) {
  if (result.kind === "consult") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="hd-1">Let&apos;s talk first</h1>
        <p className="body">{result.message}</p>
        <div className="flex justify-center gap-3">
          <Link href="/clinic" className="inline-flex h-12 items-center bg-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Book a consultation</Link>
          <button onClick={onRestart} className="inline-flex h-12 items-center border border-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em]">Start over</button>
        </div>
      </div>
    );
  }

  const { picks, total, pack, excluded, uncovered } = result;
  const compare = picks.reduce((s, p) => s + p.product.compareAt, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="label text-grey">Your personalised stack</p>
          <h1 className="hd-1 mt-3">{picks.length} {picks.length === 1 ? "formula" : "formulas"} for {answers.goals.filter((g) => !uncovered.includes(g)).map((g) => GOAL_LABELS[g].toLowerCase()).join(" & ") || "you"}</h1>
        </div>
        <button onClick={onRestart} className="label hover:underline">Retake quiz</button>
      </div>

      <div className="grid gap-12 pt-8 lg:grid-cols-12">
        <ol className="divide-y divide-line lg:col-span-8">
          {picks.map(({ product: p, reasons }, i) => (
            <li key={p.handle} className="grid grid-cols-[96px_1fr] gap-5 py-6 first:pt-0 md:grid-cols-[140px_1fr_auto]">
              <Link href={`/products/${p.handle}`} className="relative aspect-square bg-tile">
                {p.image && <Image src={p.image} alt={p.title} fill sizes="140px" className="object-contain mix-blend-multiply" />}
              </Link>
              <div>
                <p className="label text-grey">Pick {i + 1}</p>
                <Link href={`/products/${p.handle}`} className="mt-1 block text-[17px] font-semibold hover:underline">{p.title}</Link>
                {p.keyActive && <p className="small">{p.keyActive}</p>}
                <ul className="mt-3 space-y-1.5">
                  {reasons.map((r) => (
                    <li key={r} className="flex gap-2 text-[14px]"><span aria-hidden className="mt-[7px] size-1.5 shrink-0 bg-black" />{r}</li>
                  ))}
                </ul>
              </div>
              <p className="col-start-2 text-[15px] font-semibold md:col-start-3 md:text-right">{inr(p.price)}<span className="block text-[12px] font-normal text-grey">per month</span></p>
            </li>
          ))}
        </ol>

        <aside className="lg:col-span-4">
          <div className="border border-black p-6 lg:sticky lg:top-32">
            <p className="label">Your stack</p>
            <div className="mt-4 flex items-baseline justify-between"><span className="text-[15px]">Monthly total</span><span className="text-[24px] font-semibold">{inr(total)}</span></div>
            {compare > total && <p className="small text-right line-through">{inr(compare)}</p>}
            <button onClick={() => onAddAll(picks.map((p) => p.product))}
              className="mt-5 h-13 w-full bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626]">
              Add all to cart
            </button>
            <p className="small mt-3">Save up to 40% more with a 3 or 12-month supply on each product page.</p>

            {pack && (
              <div className="mt-6 border-t border-line pt-6">
                <p className="label">Or save with a pack</p>
                <Link href={`/products/${pack.product.handle}`} className="mt-3 flex items-center gap-4 hover:underline">
                  <span className="relative size-16 shrink-0 bg-tile">{pack.product.image && <Image src={pack.product.image} alt="" fill sizes="64px" className="object-contain mix-blend-multiply" />}</span>
                  <span>
                    <span className="block text-[15px] font-semibold">{pack.product.title}</span>
                    <span className="small">{inr(pack.product.price)}/mo · saves {inr(pack.saving)} vs separately</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {uncovered.length > 0 && (
        <div className="mt-12 border border-black p-6">
          <p className="text-[14px] font-semibold">Not covered: {uncovered.map((g) => GOAL_LABELS[g].toLowerCase()).join(", ")}</p>
          <p className="small mt-1">Based on your answers or budget, none of our formulas is a safe fit for this right now. Our clinic can help with a personal plan.</p>
        </div>
      )}
      {excluded.length > 0 && (
        <div className="mt-12 bg-tile p-6">
          <p className="text-[14px] font-semibold">Left out based on your answers</p>
          <ul className="small mt-2 list-disc pl-5">{excluded.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      <p className="small mt-8 max-w-[80ch]">
        Suggestions are based on your answers and our formulas, not a medical diagnosis. If you have a health condition or take medication, consult your doctor.
        Want a personal plan? <Link href="/clinic" className="text-black underline">Book a consultation with our clinic</Link>.
      </p>
    </div>
  );
}
