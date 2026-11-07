"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Film = { id: string; title: string };

/**
 * Featured player + playlist. The featured film previews silently (muted autoplay loop) like the original site;
 * clicking "Watch with sound" or a playlist item swaps in the full player.
 */
export function FilmTheatre({ films }: { films: Film[] }) {
  const [i, setI] = useState(0);
  const [sound, setSound] = useState(false);
  const f = films[i];
  const src = sound
    ? `https://www.youtube-nocookie.com/embed/${f.id}?autoplay=1&rel=0&modestbranding=1`
    : `https://www.youtube-nocookie.com/embed/${f.id}?autoplay=1&mute=1&loop=1&playlist=${f.id}&controls=0&modestbranding=1&playsinline=1&rel=0`;
  const pick = (n: number) => { setI(n); setSound(true); };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
      <div className="relative aspect-video overflow-hidden rounded-[24px] bg-black">
        <AnimatePresence mode="wait">
          <motion.div key={f.id + sound} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- poster under the player */}
            <img src={`https://i.ytimg.com/vi/${f.id}/maxresdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <iframe src={src} title={f.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
              className={`absolute inset-0 h-full w-full ${sound ? "" : "pointer-events-none scale-[1.25]"}`} />
          </motion.div>
        </AnimatePresence>
        {!sound && (
          <div className="absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgba(0,0,0,.75),transparent_55%)] p-5 md:p-8">
            <div className="flex w-full flex-wrap items-end justify-between gap-4">
              <p className="hidden max-w-[40ch] sm:block text-[clamp(1rem,0.9rem+0.5vw,1.35rem)] font-semibold leading-snug text-white">{f.title}</p>
              <button onClick={() => setSound(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-semibold text-ink transition-transform hover:-translate-y-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1l8 5-8 5z" fill="currentColor" /></svg>Watch with sound
              </button>
            </div>
          </div>
        )}
      </div>

      <ol className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:max-h-[min(56.25vw,560px)] lg:flex-col lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar]:hidden" aria-label="Playlist">
        {films.map((v, n) => (
          <li key={v.id} className="w-[220px] shrink-0 lg:w-auto">
            <button onClick={() => pick(n)} aria-current={n === i}
              className={`group flex w-full gap-3 rounded-2xl p-2 text-left transition-colors max-lg:flex-col ${n === i ? "bg-white/10" : "hover:bg-white/5"}`}>
              <span className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-white/5 lg:w-[150px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
                <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                {n === i && <span className="absolute left-2 top-2 rounded-full bg-teal px-2 py-0.5 text-[11px] font-semibold text-ink">Now playing</span>}
              </span>
              <span className={`line-clamp-3 text-[14px] leading-snug ${n === i ? "text-white" : "text-white/70"}`}>{v.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
