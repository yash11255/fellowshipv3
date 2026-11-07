import Link from "next/link";
import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "outline" | "white" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold uppercase tracking-[0.06em] transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-[#262626]",
  outline: "border border-black text-black hover:bg-black hover:text-white",
  white: "bg-white text-black hover:bg-tile",
  link: "h-auto! px-0! text-black underline underline-offset-4 decoration-1 hover:decoration-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-[12px]",
  lg: "h-13 px-8 text-[13px]",
};

type Common = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export function Button({ variant = "primary", size = "md", children, className, ...rest }: Common & ComponentProps<"button">) {
  return <button className={clsx(base, variants[variant], sizes[size], className)} {...rest}>{children}</button>;
}

export function ButtonLink({ variant = "primary", size = "md", children, className, ...rest }: Common & ComponentProps<typeof Link>) {
  return <Link className={clsx(base, variants[variant], sizes[size], className)} {...rest}>{children}</Link>;
}
