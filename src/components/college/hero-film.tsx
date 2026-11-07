"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed background film, the same YouTube film that plays on the original site's hero.
 * Muted, looped, no controls; the poster shows until the film is ready (and stays for reduced-motion users).
 */
export function HeroFilm({ id, poster }: { id: string; poster: string }) {
  const [play, setPlay] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);

  const frame = useRef<HTMLIFrameElement>(null);
  // Reveal the film only once YouTube reports it is actually playing (autoplay can be blocked).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      try { const d = JSON.parse(e.data); if (d?.info?.playerState === 1) setReady(true); } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the film client-side only
    setPlay(true);
  }, []);

  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1`;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      {play && !paused && (
        <iframe
          src={src} title="Arthroscopy College film" allow="autoplay; encrypted-media" tabIndex={-1} aria-hidden ref={frame} onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*")}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.4]"
        />
      )}
      <Image src={poster} alt="" fill priority sizes="100vw" className={`z-[1] object-cover pointer-events-none transition-opacity duration-1000 ${ready && !paused ? "opacity-0" : "opacity-100"}`} />
      {play && (
        <button onClick={() => setPaused((p) => !p)} aria-label={paused ? "Play background film" : "Pause background film"}
          className="absolute bottom-6 right-6 z-10 grid size-10 place-items-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur transition-colors hover:bg-black/50">
          {paused ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1l8 5-8 5z" fill="currentColor" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor" /></svg>}
        </button>
      )}
    </div>
  );
}
