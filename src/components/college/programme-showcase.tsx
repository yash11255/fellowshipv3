"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type ShowcaseItem = { n: string; t: string; d: string; m: string; tags: string[]; href: string; apply: string; img: string };
const ease = [0.22, 1, 0.36, 1] as const;

/** Desktop: list on the left drives a large crossfading preview on the right. Mobile: swipeable image cards. */
export function ProgrammeShowcase({ items }: { items: ShowcaseItem[] }) {
  const [a, setA] = useState(0);
  const cur = items[a];
  return (
    <>
      <div className="hidden gap-16 lg:grid lg:grid-cols-[1fr_1.15fr]">
        <ul className="self-center">
          {items.map((p, i) => (
            <li key={p.n}>
              <button onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)} aria-pressed={a === i}
                className="group relative flex w-full items-baseline gap-6 rounded-md py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <span className={`text-[13px] tabular-nums transition-colors ${a === i ? "text-brand" : "text-ink/30"}`}>{p.n}</span>
                <span className={`text-[clamp(1.6rem,1rem+1.6vw,2.6rem)] font-semibold leading-tight tracking-[-0.035em] transition-all duration-500 ${a === i ? "translate-x-2 text-ink" : "text-ink/25 group-hover:text-ink/50"}`}>{p.t}</span>
                <span className="absolute inset-x-0 bottom-0 h-px bg-ink/10">
                  {a === i && <motion.span layoutId="prog-line" className="absolute inset-y-0 left-0 w-full bg-ink" transition={{ duration: 0.6, ease }} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="relative aspect-[4/5] max-h-[680px] w-full overflow-hidden rounded-[32px] bg-ink text-white">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={cur.img + a} className="absolute inset-0" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease }}>
              <Image src={cur.img} alt="" fill sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,21,38,.92),rgba(15,21,38,.1)_60%)]" />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 p-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={a} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45, ease }}>
                <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-teal">{cur.m}</p>
                <p className="mt-4 max-w-[34ch] text-[20px] leading-snug text-white/90">{cur.d}</p>
                <div className="mt-5 flex flex-wrap gap-2">{cur.tags.map((t) => <span key={t} className="rounded-full border border-white/25 px-3 py-1 text-[13px] text-white/80">{t}</span>)}</div>
                <div className="mt-8 flex gap-3">
                  <Link href={cur.href} className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[14px] font-semibold text-ink transition-transform hover:-translate-y-0.5">Explore programme</Link>
                  <Link href={cur.apply} className="inline-flex h-12 items-center rounded-full border border-white/40 px-6 text-[14px] font-medium hover:bg-white/10">Apply</Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <li key={p.n} className="w-[84vw] max-w-[380px] shrink-0 snap-center">
            <Link href={p.href} className="relative block aspect-[4/5] overflow-hidden rounded-[26px] bg-ink text-white">
              <Image src={p.img} alt="" fill sizes="84vw" className="object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,21,38,.92),rgba(15,21,38,.05)_60%)]" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-teal">{p.n} · {p.m}</p>
                <p className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.03em]">{p.t}</p>
                <p className="mt-2 text-[15px] leading-snug text-white/80">{p.d}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
