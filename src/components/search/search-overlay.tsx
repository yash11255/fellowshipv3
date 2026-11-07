"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import clsx from "clsx";
import { search } from "@/lib/search";
import { useSearchIndex } from "./use-search-index";

const POPULAR = ["NMN", "Collagen", "Shilajit", "Joint pain", "Sleep", "Creatine", "Omega 3", "Hair fall"];
const CONCERNS = [["Low energy", "/shop/energy"], ["Joint pain", "/shop/joints-bones"], ["Poor sleep", "/shop/sleep-stress"], ["Ageing skin", "/shop/skin-hair-nails"], ["Gut health", "/shop/gut"], ["Healthy ageing", "/shop/longevity"]];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

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

  const go = (href: string) => { onClose(); setQ(""); router.push(href); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); if (results[active]) go(`/products/${results[active].handle}`); else if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-[60] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
          <motion.div key="panel" role="dialog" aria-modal="true" aria-label="Search"
            className="fixed inset-x-0 top-0 z-[61] max-h-[100dvh] overflow-y-auto bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)]"
            initial={{ y: reduce ? 0 : "-100%", opacity: reduce ? 0 : 1 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : "-100%", opacity: reduce ? 0 : 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <div className="page pb-10 pt-5 md:pt-8">
              <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" /></svg>
                <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKeyDown}
                  placeholder="Search products, ingredients or concerns" aria-label="Search" role="combobox" aria-expanded={results.length > 0} aria-controls="search-results"
                  className="h-12 flex-1 bg-transparent text-[20px] font-medium tracking-[-0.01em] outline-none placeholder:text-mute md:text-[28px]" />
                {q && <button onClick={() => setQ("")} className="text-[13px] text-grey hover:text-black">Clear</button>}
                <button onClick={onClose} className="label ml-2 hover:underline" aria-label="Close search">Close</button>
              </div>

              {!q.trim() ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="grid gap-10 pt-8 md:grid-cols-2">
                  <div>
                    <p className="label text-grey">Popular searches</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {POPULAR.map((p) => <button key={p} onClick={() => setQ(p)} className="h-9 border border-line px-4 text-[14px] transition-colors hover:border-black">{p}</button>)}
                    </div>
                  </div>
                  <div>
                    <p className="label text-grey">Shop by concern</p>
                    <ul className="mt-4 grid grid-cols-2 gap-x-6">
                      {CONCERNS.map(([l, h]) => <li key={h}><button onClick={() => go(h)} className="group flex w-full items-center justify-between border-b border-line py-3 text-[15px]">{l}<span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span></button></li>)}
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="label text-grey">{items ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Loading…"}</p>
                    {results.length > 0 && <button onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} className="text-[13px] underline">See all results</button>}
                  </div>
                  {items && results.length === 0 && (
                    <div className="py-10">
                      <p className="text-[18px] font-semibold">No matches for “{q}”</p>
                      <p className="body mt-1">Try an ingredient (NMN, collagen) or a concern (sleep, joints), or <button className="underline" onClick={() => go("/stack-builder")}>find your stack</button>.</p>
                    </div>
                  )}
                  <ul id="search-results" role="listbox" className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
                    {results.map((r, i) => (
                      <motion.li key={r.handle} role="option" aria-selected={i === active}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * 0.035, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
                        <Link href={`/products/${r.handle}`} onClick={() => { onClose(); setQ(""); }} onMouseEnter={() => setActive(i)} className="group block">
                          <div className={clsx("relative aspect-square overflow-hidden bg-tile transition-shadow", i === active && "ring-2 ring-black")}>
                            {r.image && <Image src={r.image} alt="" fill sizes="(min-width:768px) 22vw, 45vw" className="object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />}
                          </div>
                          <p className="mt-2 text-[14px] font-semibold leading-snug">{r.title}</p>
                          <p className="small">{r.actives[0] ?? r.goals.slice(0, 2).join(" · ")}</p>
                          <p className="mt-1 text-[14px]"><span className="font-semibold">{inr(r.price)}</span>{!r.available && <span className="ml-2 text-[12px] text-grey">Sold out</span>}</p>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-8 hidden text-[12px] text-mute md:block">Tip: press <kbd className="rounded border border-line px-1">/</kbd> anywhere to search · <kbd className="rounded border border-line px-1">↑</kbd><kbd className="rounded border border-line px-1">↓</kbd> to move · <kbd className="rounded border border-line px-1">Enter</kbd> to open</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
