"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { search, type SearchItem } from "@/lib/search";
import { useSearchIndex } from "./use-search-index";

const POPULAR = ["Fellowship fee", "ACL course", "Shoulder", "Physiotherapy", "Certificate", "Internal brace"];
const QUICK: [string, string][] = [["Fellowship in Arthroscopy", "/programs/fellowship-in-arthroscopy"], ["Next-Gen ACL Course", "/programs/advance-acl-course"], ["Physiotherapy Internship", "/programs/physiotherapy-internship"], ["Apply online", "/apply"], ["Dr. Manu Bora", "/dr-manu-bora"], ["Contact us", "/contact-us"]];

export function ResultRow({ r, active, onClick }: { r: SearchItem; active?: boolean; onClick?: () => void }) {
  return (
    <Link href={r.href} onClick={onClick} className={`flex items-center gap-4 rounded-2xl p-3 transition-colors ${active ? "bg-mist" : "hover:bg-mist"}`}>
      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-mist text-[11px] font-semibold uppercase text-ink/40">
        {/* eslint-disable-next-line @next/next/no-img-element -- mixed local + YouTube thumbnails */}
        {r.image ? <img src={r.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : r.kind.slice(0, 3)}
      </span>
      <span className="min-w-0">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-brand">{r.kind}</span>
        <span className="block truncate text-[16px] font-semibold">{r.title}</span>
        {r.sub && <span className="block truncate text-[13px] text-ink/55">{r.sub}</span>}
      </span>
    </Link>
  );
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const items = useSearchIndex(open);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => (items ? search(items, q, 8) : []), [items, q]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 60);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const close = () => { onClose(); setQ(""); };
  const go = (href: string) => { close(); router.push(href); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(results[active].href); else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div key="panel" role="dialog" aria-modal="true" aria-label="Search"
            className="fixed inset-x-3 top-3 z-[61] mx-auto max-h-[calc(100dvh-24px)] max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl"
            initial={{ y: reduce ? 0 : -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : -24, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="text-ink/50"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" /></svg>
              <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKeyDown}
                placeholder="Search programmes, fees, articles, films" aria-label="Search" role="combobox" aria-expanded={results.length > 0} aria-controls="search-results"
                className="h-10 flex-1 bg-transparent text-[18px] outline-none placeholder:text-ink/35" />
              <button onClick={onClose} className="rounded-full border border-ink/15 px-3 py-1 text-[12px] font-medium hover:border-ink" aria-label="Close search">Esc</button>
            </div>
            <div className="p-4 md:p-5">
              {!q.trim() ? (
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">Popular</p>
                    <div className="mt-3 flex flex-wrap gap-2">{POPULAR.map((p) => <button key={p} onClick={() => setQ(p)} className="rounded-full border border-ink/15 px-4 py-1.5 text-[14px] hover:border-ink">{p}</button>)}</div>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">Go to</p>
                    <ul className="mt-2">{QUICK.map(([l, h]) => <li key={h}><button onClick={() => go(h)} className="group flex w-full items-center justify-between py-2 text-[15px] hover:text-brand">{l}<span aria-hidden className="transition-transform group-hover:translate-x-1">→</span></button></li>)}</ul>
                  </div>
                </div>
              ) : (
                <>
                  <p className="px-1 text-[12px] text-ink/45">{items ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Loading…"}</p>
                  {items && results.length === 0 && <p className="px-1 py-8 text-[15px]">No matches for “{q}”. Try “fee”, “ACL” or “shoulder”, or <Link href="/contact-us" onClick={close} className="text-brand underline">ask us</Link>.</p>}
                  <ul id="search-results" role="listbox" className="mt-2 space-y-1">
                    {results.map((r, i) => <li key={r.href + i} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)}><ResultRow r={r} active={i === active} onClick={close} /></li>)}
                  </ul>
                  {results.length > 0 && <button onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="mt-3 px-1 text-[14px] font-semibold text-brand hover:underline">See all results →</button>}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
