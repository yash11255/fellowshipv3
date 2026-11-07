"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SearchOverlay } from "@/components/search/search-overlay";
import { Logo } from "@/components/logo";

const nav = [
  { href: "/programs/fellowship-in-arthroscopy", label: "Fellowship" },
  { href: "/programs/advance-acl-course", label: "ACL Course" },
  { href: "/programs/physiotherapy-internship", label: "Physiotherapy" },
  { href: "/dr-manu-bora", label: "Dr. Manu Bora" },
  { href: "/videos", label: "Videos" },
  { href: "/gallery", label: "Gallery" },
  { href: "/journal", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

/* Apple-style global nav: 48px, translucent, small centred links. */
export function Header() {
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      <header className="sticky top-0 z-40 bg-[rgba(250,250,252,0.8)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-4">
          <Link href="/" aria-label="Arthroscopy College home" className="shrink-0"><Logo className="h-7 w-auto mix-blend-multiply" /></Link>
          <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex" aria-label="Primary">
            {nav.map((n) => <Link key={n.href} href={n.href} className="text-[12px] text-[#1d1d1f]/80 transition-colors hover:text-[#1d1d1f]">{n.label}</Link>)}
          </nav>
          <div className="flex items-center gap-5">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="text-[#1d1d1f]/80 hover:text-[#1d1d1f]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" /></svg>
            </button>
            <Link href="/apply" className="hidden rounded-full bg-[#0071e3] px-3 py-1 text-[12px] text-white hover:bg-[#0077ed] sm:inline-block">Apply</Link>
            <button className="lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="mobile-nav" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d={menu ? "M6 6l12 12M18 6L6 18" : "M4 9h16M4 15h16"} /></svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menu && (
            <motion.nav id="mobile-nav" aria-label="Mobile" className="overflow-hidden bg-[#fafafc] lg:hidden"
              initial={{ height: 0 }} animate={{ height: "100dvh" }} exit={{ height: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <ul className="px-10 pt-6">
                {[...nav, { href: "/apply", label: "Apply" }, { href: "/account", label: "Student login" }].map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.03 }}>
                    <Link href={n.href} onClick={() => setMenu(false)} className="block py-2 text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f]">{n.label}</Link>
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
