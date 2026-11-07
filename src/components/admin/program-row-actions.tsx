"use client";
import { useTransition } from "react";
import { moveProgram, setProgramPublished } from "@/lib/cms-actions";

export function ProgramRowActions({ slug, published, first, last }: { slug: string; published: boolean; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const b = "h-7 rounded-md border border-[#e3e3e3] px-2 text-[12px] hover:bg-[#f4f4f4] disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <button className={b} disabled={pending || first} onClick={() => start(async () => { await moveProgram(slug, -1); })} aria-label="Move up">↑</button>
      <button className={b} disabled={pending || last} onClick={() => start(async () => { await moveProgram(slug, 1); })} aria-label="Move down">↓</button>
      <button className={b} disabled={pending} onClick={() => start(async () => { await setProgramPublished(slug, !published); })}>{published ? "Hide" : "Show"}</button>
    </div>
  );
}
