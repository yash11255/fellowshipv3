"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export type Tile = {
  href: string;
  caption: string;
  image: string;
  /** large label printed over a darkened image (category style) */
  overlay?: string;
  /** "photo" fills the tile; "product" centres a packshot on grey until real photography exists */
  fit?: "photo" | "product";
};

/** Minimalist-style carousel: 4-up landscape tiles, caption below, progress bar + arrows. */
export function TileCarousel({ title, tiles }: { title: string; tiles: Tile[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ ratio: 0, visible: 1, atStart: true, atEnd: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setState({
        ratio: max > 0 ? el.scrollLeft / max : 0,
        visible: Math.min(1, el.clientWidth / el.scrollWidth),
        atStart: el.scrollLeft <= 2,
        atEnd: el.scrollLeft >= max - 2,
      });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { el.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });
  const thumb = state.visible * 100;

  return (
    <section className="page pt-16 md:pt-20" aria-roledescription="carousel" aria-label={title}>
      <h2 className="text-[26px] font-medium tracking-[-0.02em] md:text-[30px]">{title}</h2>

      <ul ref={track}
        className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] md:mx-0 md:gap-8 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {tiles.map((t) => (
          <li key={t.href + t.caption} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[calc((100%-6rem)/4)]">
            <Link href={t.href} className="group block">
              <div className={clsx("relative aspect-[4/3] overflow-hidden", t.fit === "product" ? "bg-tile" : "bg-[#d9d9d9]")}>
                <Image src={t.image} alt="" fill sizes="(min-width:1024px) 23vw, (min-width:640px) 45vw, 78vw"
                  className={clsx("transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]",
                    t.fit === "product" ? "object-contain p-[10%] mix-blend-multiply" : "object-cover")} />
                {t.overlay && (
                  <>
                    <div className="absolute inset-0 bg-black/35" />
                    <span className="absolute inset-0 grid place-items-center text-center text-[26px] font-semibold tracking-[-0.01em] text-white md:text-[30px]">{t.overlay}</span>
                  </>
                )}
              </div>
              <p className="mt-4 text-center text-[15px] group-hover:underline">{t.caption}</p>
            </Link>
          </li>
        ))}
      </ul>

      {state.visible < 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={() => page(-1)} disabled={state.atStart} aria-label="Previous" className="p-1 disabled:opacity-25">
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden><path d="M7 1L2 6l5 5" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
          <div className="relative h-[4px] w-16 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(state.ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="absolute inset-y-0 rounded-full bg-black transition-[left] duration-150"
              style={{ width: `${thumb}%`, left: `${state.ratio * (100 - thumb)}%` }} />
          </div>
          <button onClick={() => page(1)} disabled={state.atEnd} aria-label="Next" className="p-1 disabled:opacity-25">
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden><path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
