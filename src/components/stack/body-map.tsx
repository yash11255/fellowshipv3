"use client";

import clsx from "clsx";
import type { Goal } from "@/lib/catalog";

// Tappable front-view figure. Each hotspot maps to a goal.
const SPOTS: { goal: Goal; x: number; y: number; label: string; side: "l" | "r" }[] = [
  { goal: "brain", x: 100, y: 38, label: "Focus", side: "r" },
  { goal: "sleep-stress", x: 100, y: 62, label: "Sleep & stress", side: "l" },
  { goal: "heart", x: 86, y: 128, label: "Heart", side: "l" },
  { goal: "gut", x: 100, y: 182, label: "Gut", side: "r" },
  { goal: "sport", x: 146, y: 150, label: "Muscle & recovery", side: "r" },
  { goal: "joints-bones", x: 82, y: 318, label: "Joints & bones", side: "l" },
];

export function BodyMap({ selected, onToggle }: { selected: Goal[]; onToggle: (g: Goal) => void }) {
  return (
    <svg viewBox="-70 0 340 420" className="mx-auto h-full max-h-[460px] w-auto max-w-full" role="group" aria-label="Body map: tap an area to add it as a goal">
      {/* figure */}
      <g fill="none" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity=".85">
        <circle cx="100" cy="42" r="24" />
        <path d="M92 66v10M108 66v10" />
        <path d="M60 92c8-12 24-16 40-16s32 4 40 16l10 64c2 12-2 20-6 24l-8-50M60 92l-10 64c-2 12 2 20 6 24l8-50" />
        <path d="M68 108l4 96c0 8 2 14 6 18h44c4-4 6-10 6-18l4-96" />
        <path d="M78 222l-4 96 2 86M122 222l4 96-2 86M100 228v60" />
      </g>
      {SPOTS.map((s) => {
        const on = selected.includes(s.goal);
        const idx = selected.indexOf(s.goal);
        const lx = s.side === "r" ? s.x + 26 : s.x - 26;
        return (
          <g key={s.goal} className="cursor-pointer" onClick={() => onToggle(s.goal)}
            role="checkbox" aria-checked={on} aria-label={s.label} tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle(s.goal))}>
            <circle cx={s.x} cy={s.y} r="16" fill="transparent" />
            <circle cx={s.x} cy={s.y} r={on ? 9 : 6} className={clsx("transition-all duration-300", on ? "fill-black" : "fill-white stroke-black")} strokeWidth="1.4" />
            {on && <text x={s.x} y={s.y + 3.2} textAnchor="middle" className="fill-white text-[9px] font-semibold">{idx + 1}</text>}
            <line x1={s.side === "r" ? s.x + 10 : s.x - 10} y1={s.y} x2={lx} y2={s.y} stroke="#000" strokeWidth=".8" opacity={on ? 1 : .35} />
            <text x={s.side === "r" ? lx + 3 : lx - 3} y={s.y + 3.5} textAnchor={s.side === "r" ? "start" : "end"}
              className={clsx("text-[10px] transition-all", on ? "fill-black font-semibold" : "fill-[#555]")}>{s.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
