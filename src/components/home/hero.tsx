"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HeroVideo } from "./hero-video";

const ease = [0.16, 1, 0.3, 1] as const;

function Copy({ heading = true }: { heading?: boolean }) {
  const H = heading ? motion.h1 : motion.p;
  const reduce = useReducedMotion();
  const rise = (i: number) => (reduce ? {} : {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: 0.15 + i * 0.09, ease },
  });
  return (
    <div className="max-w-[540px]">
      <motion.div {...rise(0)} className="flex items-center gap-3">
        <span className="relative size-10 overflow-hidden rounded-full ring-2 ring-white">
          <Image src="/brand/dr-bora-avatar.jpg" alt="Dr. Manu Bora" fill sizes="40px" className="object-cover" />
        </span>
        <span className="text-[13px] leading-tight">
          <span className="block font-semibold">Formulated by Dr. Manu Bora</span>
          <span className="text-grey">Orthopaedic &amp; sports-medicine surgeon</span>
        </span>
      </motion.div>

      <H {...rise(1)} className="mt-7 text-[clamp(2.75rem,1.6rem+4.2vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">
        Support healthy ageing.
      </H>
      <motion.p {...rise(2)} className="mt-4 text-[clamp(1.25rem,1rem+0.8vw,1.75rem)] font-medium leading-tight tracking-[-0.02em] text-grey">
        Support energy. Live better.
      </motion.p>
      <motion.p {...rise(3)} className="mt-5 max-w-[44ch] text-[16px] leading-relaxed text-[#3d3d3d]">
        Scientifically formulated supplements for longevity, joints, energy and weight. Every dose disclosed on the label.
      </motion.p>

      <motion.div {...rise(4)} className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/shop" className="group inline-flex h-13 items-center gap-3 rounded-full bg-black pl-7 pr-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#262626]">
          Shop supplements
          <span className="grid size-7 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>→</span>
        </Link>
        <Link href="/stack-builder" className="inline-flex h-13 items-center rounded-full border border-black/20 bg-white/70 px-7 text-[14px] font-semibold backdrop-blur transition-colors hover:border-black">
          Find your stack
        </Link>
      </motion.div>

      <motion.ul {...rise(5)} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-grey">
        {["GMP certified", "Lab tested", "No artificial colours", "Free shipping ₹999+"].map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M5 12l5 5L20 7" /></svg>{t}
          </li>
        ))}
      </motion.ul>
    </div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section aria-label="Introduction" className="relative overflow-hidden bg-white">
      {/* Desktop: film fills the right ~62%; its white backdrop melts into the page so it reads full-bleed with clear space for copy */}
      <div className="relative hidden h-[min(86vh,820px)] min-h-[600px] md:block">
        <motion.div className="absolute inset-y-0 right-0 w-[60%] xl:w-[62%]"
          initial={reduce ? false : { scale: 1.04, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.4, ease }}>
          <HeroVideo variant="landscape" priority className="absolute inset-0" />
        </motion.div>
        <div className="page relative flex h-full items-center"><Copy /></div>
      </div>

      {/* Mobile: portrait film, then copy */}
      <div className="md:hidden">
        <div className="relative h-[68svh] min-h-[440px]">
          <HeroVideo variant="portrait" priority className="absolute inset-0" />
        </div>
        <div className="page pb-12 pt-8"><Copy heading={false} /></div>
      </div>
    </section>
  );
}
