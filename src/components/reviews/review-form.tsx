"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { submitReview } from "@/lib/review-actions";

export function ReviewForm({ handle, signedIn }: { handle: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [f, setF] = useState({ name: "", title: "", body: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) return <Link href={`/login?next=/products/${handle}%23reviews`} className="inline-flex h-11 items-center border border-black px-6 text-[12px] font-semibold uppercase tracking-[0.06em]">Sign in to write a review</Link>;
  if (msg?.ok) return <p className="bg-tile p-4 text-[14px]">Thanks! Your review will appear once it&apos;s approved.</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="inline-flex h-11 items-center border border-black px-6 text-[12px] font-semibold uppercase tracking-[0.06em] hover:bg-black hover:text-white">Write a review</button>;

  const field = "mt-1.5 w-full border border-line px-3 text-[15px] outline-none focus:border-black";
  return (
    <form className="max-w-xl space-y-4 bg-tile p-5" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await submitReview({ handle, rating, ...f }); setMsg(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error }); }); }}>
      <fieldset>
        <legend className="text-[13px] font-medium">Your rating</legend>
        <div className="mt-1 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button" aria-label={`${i} star${i > 1 ? "s" : ""}`} aria-pressed={rating === i} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)}
              className="p-0.5 transition-transform hover:scale-110">
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.5l1.3-6.6L2.5 9.3l6.6-.8L12 2.5z" className={clsx((hover || rating) >= i ? "fill-black" : "fill-[#d0d0d0]")} /></svg>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block"><span className="text-[13px] font-medium">Name shown with your review</span><input className={`${field} h-11`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="block"><span className="text-[13px] font-medium">Headline (optional)</span><input className={`${field} h-11`} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="block"><span className="text-[13px] font-medium">Your review</span><textarea rows={4} className={`${field} py-2`} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="How long have you taken it? What changed?" /></label>
      {msg && !msg.ok && <p role="alert" className="text-[13px] text-sale">{msg.text}</p>}
      <div className="flex gap-3">
        <button disabled={pending} className="h-11 bg-black px-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:opacity-50">{pending ? "Submitting…" : "Submit review"}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-[13px] underline">Cancel</button>
      </div>
      <p className="text-[12px] text-grey">Reviews are moderated. Please don&apos;t include medical claims or personal health details.</p>
    </form>
  );
}
