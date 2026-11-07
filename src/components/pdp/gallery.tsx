"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";

/** Desktop: vertical thumbs + large image. Mobile: swipeable full-width strip with counter. */
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  const shown = images.slice(0, 10);

  return (
    <div>
      {/* mobile */}
      <div className="-mx-4 md:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {shown.map((src, k) => (
            <div key={src} className="relative aspect-square w-full shrink-0 snap-center bg-tile">
              <Image src={src} alt={k === 0 ? title : ""} fill priority={k === 0} sizes="100vw" className="object-contain mix-blend-multiply" />
            </div>
          ))}
        </div>
        <p className="mt-2 px-4 text-right text-[12px] text-grey">{i + 1} / {shown.length}</p>
      </div>

      {/* desktop */}
      <div className="hidden gap-3 md:grid md:grid-cols-[72px_1fr]">
        <ul className="flex max-h-[680px] flex-col gap-2 overflow-y-auto [scrollbar-width:none]">
          {shown.map((src, k) => (
            <li key={src}>
              <button onClick={() => setI(k)} aria-label={`Image ${k + 1}`}
                className={clsx("relative block aspect-square w-full bg-tile outline-offset-0", k === i ? "outline outline-1 outline-black" : "opacity-70 hover:opacity-100")}>
                <Image src={src} alt="" fill sizes="72px" className="object-contain mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
        <div className="relative aspect-square bg-tile">
          <Image key={shown[i]} src={shown[i]} alt={title} fill priority sizes="(min-width:1280px) 45vw, 60vw" className="object-contain mix-blend-multiply" />
        </div>
      </div>
    </div>
  );
}
