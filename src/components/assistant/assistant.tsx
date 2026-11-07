"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSearchIndex } from "@/components/search/use-search-index";
import { respond, START_CHIPS, WHATSAPP, type Reply } from "@/lib/assistant";
import type { Program } from "@/lib/programs";

type Msg = { from: "bot" | "me"; reply?: Reply; text?: string; id: number };

export function Assistant({ programs }: { programs: Program[] }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const items = useSearchIndex(open);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", id: 0, reply: { text: "Hi! Ask me about programmes, fees, eligibility or how to apply.", chips: START_CHIPS } }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => { end.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, [msgs, typing, reduce]);

  const send = (t: string) => {
    const q = t.trim();
    if (!q) return;
    setText("");
    setMsgs((m) => [...m, { from: "me", text: q, id: idRef.current++ }]);
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, { from: "bot", id: idRef.current++, reply: respond(q, items ?? [], programs) }]); setTyping(false); }, reduce ? 0 : 400);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button key="fab" onClick={() => setOpen(true)} aria-label="Open admissions assistant" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center gap-2 rounded-full bg-ink text-[13px] font-semibold text-white shadow-lg hover:bg-brand md:bottom-5 md:right-5 md:w-auto md:pl-4 md:pr-5 lg:bottom-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
            <span className="hidden md:inline">Ask us</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.section key="panel" role="dialog" aria-label="Admissions assistant"
            initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[390px] sm:rounded-[24px]">
            <header className="flex items-center justify-between bg-ink px-5 py-4 text-white">
              <div><p className="text-[15px] font-semibold">Admissions assistant</p><p className="text-[12px] text-white/60">Instant answers · team on WhatsApp</p></div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="grid size-8 place-items-center rounded-full bg-white/10 hover:bg-white/20">✕</button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-mist p-4" aria-live="polite">
              {msgs.map((m) => m.from === "me" ? (
                <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-ink px-4 py-2 text-[14px] text-white">{m.text}</div>
              ) : (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%] space-y-2">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[14px] leading-relaxed">{m.reply!.text}</div>
                  {m.reply!.results?.map((r) => <Link key={r.href} href={r.href} onClick={() => setOpen(false)} className="block rounded-xl bg-white px-3 py-2 text-[13px] hover:ring-1 hover:ring-ink/20"><span className="text-[11px] font-semibold uppercase tracking-wider text-brand">{r.kind}</span><span className="block font-semibold">{r.title}</span></Link>)}
                  {m.reply!.links && <div className="flex flex-wrap gap-2">{m.reply!.links.map((l) => <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} target={l.href.startsWith("http") ? "_blank" : undefined} className="rounded-full border border-ink bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-ink hover:text-white">{l.label} →</Link>)}</div>}
                  {m.reply!.chips && <div className="flex flex-wrap gap-1.5">{m.reply!.chips.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border border-ink/15 bg-white px-3 py-1 text-[12px] hover:border-ink">{c}</button>)}</div>}
                </motion.div>
              ))}
              {typing && <div className="flex w-14 gap-1 rounded-2xl bg-white px-3 py-3" aria-label="Assistant is typing">{[0, 1, 2].map((i) => <motion.span key={i} className="size-1.5 rounded-full bg-ink/40" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }} />)}</div>}
              <div ref={end} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 border-t border-ink/10 p-3">
              <label htmlFor="ask" className="sr-only">Message</label>
              <input id="ask" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about fees, dates, eligibility…" maxLength={300} className="h-11 flex-1 rounded-full bg-mist px-4 text-[14px] outline-none" autoComplete="off" />
              <button disabled={!text.trim()} className="h-11 rounded-full bg-ink px-5 text-[13px] font-semibold text-white disabled:opacity-30">Send</button>
            </form>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="bg-white px-4 pb-3 text-center text-[12px] text-ink/50 hover:text-ink">Prefer a person? Chat on WhatsApp</a>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
