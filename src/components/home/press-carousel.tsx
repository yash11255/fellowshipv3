"use client";

import Image from "next/image";
import { useRef } from "react";

export type PressItem = { outlet: string; logo: string; headline: string; href: string };

/** "As seen in" feature cards: horizontal scroll-snap with arrow controls. */
export function PressCarousel({ items }: { items: PressItem[] }) {
  const track = useRef<HTMLUListElement>(null);
  const page = (d: 1 | -1) => track.current?.scrollBy({ left: d * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="relative">
      <ul ref={track} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((p) => (
          <li key={p.href + p.headline} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-3rem)/4)]">
            <a href={p.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col border border-line bg-white transition-colors hover:border-black">
              <div className="relative h-32 border-b border-line bg-white">
                <Image src={p.logo} alt={p.outlet} fill sizes="(min-width:1024px) 22vw, 70vw" className="object-contain p-6 transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="label text-grey">{p.outlet}</p>
                <p className="mt-2 text-[15px] font-semibold leading-snug">{p.headline}</p>
                <span className="mt-auto pt-4 text-[13px] underline-offset-4 group-hover:underline">Read the feature ↗</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={() => page(-1)} aria-label="Previous features" className="grid size-10 place-items-center border border-line hover:border-black">‹</button>
        <button onClick={() => page(1)} aria-label="Next features" className="grid size-10 place-items-center border border-line hover:border-black">›</button>
      </div>
    </div>
  );
}
