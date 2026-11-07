"use client";

import { useState } from "react";
import clsx from "clsx";
import { LiteYouTube } from "./lite-youtube";
import type { Video, VideoCat } from "@/lib/videos";

export function VideoLibrary({ videos, cats }: { videos: Video[]; cats: Record<VideoCat, string> }) {
  const [cat, setCat] = useState<VideoCat | "all">("all");
  const list = cat === "all" ? videos : videos.filter((v) => v.cat === cat);
  return (
    <>
      <div className="flex flex-wrap justify-center gap-2">
        {(["all", ...Object.keys(cats)] as (VideoCat | "all")[]).map((c) => (
          <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
            className={clsx("h-9 rounded-full px-4 text-[14px] transition-colors", cat === c ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]")}>
            {c === "all" ? "All" : cats[c]}
          </button>
        ))}
      </div>
      <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <li key={v.id}><LiteYouTube id={v.id} title={v.title} /><p className="mt-4 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-[#1d1d1f]">{v.title}</p><p className="mt-1 text-[14px] text-[#6e6e73]">{cats[v.cat]}</p></li>
        ))}
      </ul>
    </>
  );
}
