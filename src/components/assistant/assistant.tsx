"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/cart/cart-context";
import { useSearchIndex } from "@/components/search/use-search-index";
import { respond, START_CHIPS, type Reply } from "@/lib/assistant";

type Msg = { from: "bot" | "me"; reply?: Reply; text?: string; id: number };
const WHATSAPP = "https://wa.me/919999999999?text=Hi%20Reverse%20Clinics"; // TODO: real business number
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function Assistant() {
  const reduce = useReducedMotion();
  const { settings, add } = useCart();
  const [open, setOpen] = useState(false);
  const items = useSearchIndex(open);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", id: 0, reply: { text: "Hi! I'm the Reverse assistant. Ask me about products, delivery, COD or your order.", chips: START_CHIPS } }]);
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
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "bot", id: idRef.current++, reply: respond(q, items ?? [], settings, WHATSAPP) }]);
      setTyping(false);
    }, reduce ? 0 : 450);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button key="fab" onClick={() => setOpen(true)} aria-label="Open shopping assistant"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center gap-2 rounded-full bg-black text-[13px] font-semibold text-white shadow-lg hover:bg-[#262626] md:bottom-5 md:right-5 md:w-auto md:pl-4 md:pr-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
            <span className="hidden md:inline">Ask us</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.section key="panel" role="dialog" aria-label="Shopping assistant"
            initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduce ? 0 : 24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col bg-white shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[600px] sm:w-[380px] sm:border sm:border-line">
            <header className="flex items-center justify-between bg-black px-4 py-3 text-white">
              <div><p className="text-[14px] font-semibold">Reverse assistant</p><p className="text-[11px] text-white/60">Instant answers · team on WhatsApp</p></div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="text-[13px] text-white/80 hover:text-white">Close</button>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-[#fafafa] p-4" aria-live="polite">
              {msgs.map((m) => m.from === "me" ? (
                <div key={m.id} className="ml-auto max-w-[80%] bg-black px-3 py-2 text-[14px] text-white">{m.text}</div>
              ) : (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-[92%] space-y-2">
                  <div className="border border-line bg-white px-3 py-2 text-[14px] leading-relaxed">{m.reply!.text}</div>
                  {m.reply!.products?.map((p) => (
                    <div key={p.handle} className="flex items-center gap-3 border border-line bg-white p-2">
                      <Link href={`/products/${p.handle}`} onClick={() => setOpen(false)} className="relative size-14 shrink-0 bg-tile">{p.image && <Image src={p.image} alt="" fill sizes="56px" className="object-contain mix-blend-multiply" />}</Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${p.handle}`} onClick={() => setOpen(false)} className="block truncate text-[13px] font-semibold hover:underline">{p.title}</Link>
                        <p className="text-[12px] text-grey">{inr(p.price)}{p.actives[0] ? ` · ${p.actives[0]}` : ""}</p>
                      </div>
                      {p.available && <button onClick={() => add({ handle: p.handle, title: p.title, image: p.image, months: 1, price: p.price, compareAt: p.compareAt })} className="h-8 shrink-0 bg-black px-3 text-[11px] font-semibold uppercase text-white">Add</button>}
                    </div>
                  ))}
                  {m.reply!.links && <div className="flex flex-wrap gap-2">{m.reply!.links.map((l) => <Link key={l.href + l.label} href={l.href} onClick={() => setOpen(false)} target={l.href.startsWith("http") ? "_blank" : undefined} className="border border-black bg-white px-3 py-1.5 text-[12px] font-semibold hover:bg-black hover:text-white">{l.label} →</Link>)}</div>}
                  {m.reply!.chips && <div className="flex flex-wrap gap-1.5">{m.reply!.chips.map((c) => <button key={c} onClick={() => send(c)} className="rounded-full border border-line bg-white px-3 py-1 text-[12px] hover:border-black">{c}</button>)}</div>}
                </motion.div>
              ))}
              {typing && <div className="flex w-14 gap-1 border border-line bg-white px-3 py-3" aria-label="Assistant is typing">{[0, 1, 2].map((i) => <motion.span key={i} className="size-1.5 rounded-full bg-grey" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }} />)}</div>}
              <div ref={end} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex border-t border-line">
              <label htmlFor="ask" className="sr-only">Message</label>
              <input id="ask" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about joints, delivery, COD…" maxLength={300} className="h-13 flex-1 px-4 text-[14px] outline-none" autoComplete="off" />
              <button disabled={!text.trim()} className="px-5 text-[12px] font-semibold uppercase tracking-[0.06em] disabled:text-mute">Send</button>
            </form>
            <p className="bg-white px-4 pb-2 text-[10.5px] text-mute">Automated answers, not medical advice.</p>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
