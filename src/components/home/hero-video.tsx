"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Brand film (from the original Shopify site). Fills its positioned parent.
 * `variant` picks the asset; the poster paints immediately, the video loads after mount.
 * Reduced-motion users keep the still. Exposes a pause control (WCAG 2.2.2).
 */
export function HeroVideo({ variant, className, priority }: { variant: "landscape" | "portrait"; className?: string; priority?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [playing, setPlaying] = useState(true);
  const base = `/video/hero-${variant}`;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // only load the asset for the breakpoint that's actually visible
    const mq = window.matchMedia(variant === "portrait" ? "(max-width: 767px)" : "(min-width: 768px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- decide once on mount, client-only
    setOn(mq.matches);
  }, [variant]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div className={className}>
      <Image src={`${base}.jpg`} alt="" fill priority={priority} sizes="100vw" className="object-cover" />
      {on && <video ref={ref} src={`${base}.mp4`} autoPlay muted loop playsInline preload="auto" aria-hidden className="absolute inset-0 h-full w-full object-cover" />}
      {on && (
        <button onClick={toggle} aria-label={playing ? "Pause video" : "Play video"}
          className="absolute bottom-4 left-4 z-10 grid size-9 place-items-center rounded-full border border-black/10 bg-white/80 text-black backdrop-blur transition-colors hover:bg-white">
          {playing
            ? <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden><path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor" /></svg>
            : <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden><path d="M3 1l8 5-8 5z" fill="currentColor" /></svg>}
        </button>
      )}
    </div>
  );
}
