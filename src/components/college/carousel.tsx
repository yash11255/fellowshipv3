"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

/** Scroll-snap carousel with arrow controls and a slim progress line. Swipe on touch, drag-scroll with trackpads. */
export function Carousel({ children, label, itemClass = "w-[82vw] sm:w-[420px]", dark }: { children: ReactNode; label: string; itemClass?: string; dark?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [p, setP] = useState({ ratio: 0, vis: 1, start: true, end: false });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const u = () => { const max = el.scrollWidth - el.clientWidth; setP({ ratio: max > 0 ? el.scrollLeft / max : 0, vis: Math.min(1, el.clientWidth / el.scrollWidth), start: el.scrollLeft < 4, end: el.scrollLeft > max - 4 }); };
    u(); el.addEventListener("scroll", u, { passive: true }); window.addEventListener("resize", u);
    return () => { el.removeEventListener("scroll", u); window.removeEventListener("resize", u); };
  }, []);
  const go = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  const btn = `grid size-11 place-items-center rounded-full border transition-colors disabled:opacity-30 ${dark ? "border-white/25 text-white hover:bg-white hover:text-ink" : "border-ink/15 text-ink hover:bg-ink hover:text-white"}`;
  return (
    <div aria-roledescription="carousel" aria-label={label}>
      <ul ref={ref} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] pb-2 [--gutter:16px] [scrollbar-width:none] md:[--gutter:32px] xl:[--gutter:max(48px,calc((100vw-96rem)/2+48px))] [&::-webkit-scrollbar]:hidden">
        {Children.map(children, (c) => <li className={`shrink-0 snap-start ${itemClass}`}>{c}</li>)}
      </ul>
      <div className="page mt-8 flex items-center gap-6">
        <div className={`relative h-px flex-1 ${dark ? "bg-white/15" : "bg-ink/10"}`}>
          <div className={`absolute inset-y-0 ${dark ? "bg-white" : "bg-ink"} transition-[left] duration-150`} style={{ width: `${p.vis * 100}%`, left: `${p.ratio * (100 - p.vis * 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <button className={btn} onClick={() => go(-1)} disabled={p.start} aria-label="Previous"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M15 6l-6 6 6 6" /></svg></button>
          <button className={btn} onClick={() => go(1)} disabled={p.end} aria-label="Next"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M9 6l6 6-6 6" /></svg></button>
        </div>
      </div>
    </div>
  );
}
