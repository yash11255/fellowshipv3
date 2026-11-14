"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SearchOverlay } from "@/components/search/search-overlay";
import { Logo } from "@/components/logo";
import { AccountMenu } from "./account-menu";

const nav = [
  { href: "/programs/fellowship-in-arthroscopy", label: "Fellowship" },
  { href: "/programs/advance-acl-course", label: "ACL Course" },
  { href: "/programs/physiotherapy-internship", label: "Physiotherapy" },
  { href: "/dr-manu-bora", label: "Dr. Manu Bora" },
  { href: "/videos", label: "Videos" },
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Blog" },
  { href: "/contact-us", label: "Contact" },
];

/* College nav: logo left, roomy links, navy apply pill; gains a hairline once scrolled. */
export function Header() {
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_rgba(15,21,38,.08)]" : ""}`}>
        <div className="page flex h-[68px] items-center justify-between gap-8">
          <Link href="/" aria-label="Arthroscopy College home" className="shrink-0"><Logo className="h-9 w-auto mix-blend-multiply" /></Link>
          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex" aria-label="Primary">
            {nav.map((n) => <Link key={n.href} href={n.href} className="text-[14px] font-medium text-ink/70 transition-colors hover:text-ink">{n.label}</Link>)}
          </nav>
          <div className="flex items-center gap-5">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="text-ink/70 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" /></svg>
            </button>
            <AccountMenu />
            <Link href="/apply" className="hidden rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-brand sm:inline-block">Apply</Link>
            <button className="lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-nav" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d={menu ? "M6 6l12 12M18 6L6 18" : "M4 9h16M4 15h16"} /></svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav id="mobile-nav" aria-label="Mobile" className="overflow-hidden bg-white lg:hidden"
              initial={{ height: 0 }} animate={{ height: "100dvh" }} exit={{ height: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <ul className="px-10 pt-6">
                {[...nav, { href: "/apply", label: "Apply" }, { href: "/account", label: "My dashboard / Sign in" }].map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.03 }}>
                    <Link href={n.href} onClick={() => setMenu(false)} className="block py-2 text-[28px] font-semibold tracking-[-0.02em] text-ink">{n.label}</Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
