import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "white" | "black" | "sale";

const tones: Record<Tone, string> = {
  white: "bg-white text-black",
  black: "bg-black text-white",
  sale: "bg-sale text-white",
};

export function Tag({ tone = "white", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex h-6 items-center px-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]", tones[tone], className)}>
      {children}
    </span>
  );
}
