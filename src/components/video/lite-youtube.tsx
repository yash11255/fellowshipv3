"use client";

import { useState } from "react";

/** Click-to-load YouTube: thumbnail only until played, so pages stay fast. */
export function LiteYouTube({ id, title, rounded = true }: { id: string; title: string; rounded?: boolean }) {
  const [on, setOn] = useState(false);
  return (
    <div className={`group relative aspect-video overflow-hidden bg-black ${rounded ? "rounded-[18px]" : ""}`}>
      {on ? (
        <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full" />
      ) : (
        <button onClick={() => setOn(true)} aria-label={`Play: ${title}`} className="absolute inset-0 h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full scale-[1.02] object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
          <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 py-2 pl-2.5 pr-4 text-[13px] font-medium text-black backdrop-blur">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden><path d="M8 5v14l11-7z" fill="currentColor" /></svg>Play
          </span>
        </button>
      )}
    </div>
  );
}
