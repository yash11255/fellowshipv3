"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/** Module tabs (left) with an animated item list (right). Stacks on mobile. */
export function Curriculum({ modules }: { modules: { title: string; items: string[] }[] }) {
  const [a, setA] = useState(0);
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:gap-14">
      <div role="tablist" aria-label="Modules" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-col md:px-0">
        {modules.map((m, i) => (
          <button key={m.title} role="tab" aria-selected={a === i} onClick={() => setA(i)}
            className={`relative shrink-0 rounded-2xl px-5 py-4 text-left transition-colors ${a === i ? "text-white" : "text-ink/60 hover:bg-ink/5 hover:text-ink"}`}>
            {a === i && <motion.span layoutId="cur-pill" className="absolute inset-0 -z-0 rounded-2xl bg-ink" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
            <span className="relative z-10 block text-[12px] tabular-nums opacity-60">{String(i + 1).padStart(2, "0")}</span>
            <span className="relative z-10 block whitespace-nowrap text-[16px] font-semibold md:whitespace-normal">{m.title}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.ol key={a} role="tabpanel" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="divide-y divide-ink/10 border-y border-ink/10">
          {modules[a].items.map((it, i) => (
            <motion.li key={it} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="flex items-baseline gap-5 py-5 text-[17px] leading-snug">
              <span className="text-[13px] tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>{it}
            </motion.li>
          ))}
        </motion.ol>
      </AnimatePresence>
    </div>
  );
}
