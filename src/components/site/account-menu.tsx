"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth-actions";

type Me = { email: string; name: string | null; staff: boolean } | null;

/** Header: "Sign in" when signed out; initials + menu (dashboard, admin, sign out) when signed in. */
export function AccountMenu() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/me", { cache: "no-store" }).then((r) => r.json()).then(setMe).catch(() => setMe(null)); }, [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (me === undefined) return <span className="hidden h-10 w-[84px] sm:block" aria-hidden />;
  if (!me) return <Link href={`/login?next=${encodeURIComponent(path.startsWith("/login") ? "/account" : path)}`} className="hidden h-10 items-center rounded-full border border-ink/15 px-4 text-[14px] font-semibold text-ink transition-colors hover:border-ink sm:inline-flex">Sign in</Link>;

  const initials = (me.name || me.email).replace(/@.*/, "").split(/[\s._-]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu" className="grid size-10 place-items-center rounded-full bg-mist text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white">{initials}</button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
          <p className="truncate border-b border-ink/10 px-4 py-3 text-[13px] text-ink/60">Signed in as<span className="block truncate font-semibold text-ink">{me.email}</span></p>
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] hover:bg-mist">My dashboard</Link>
          {me.staff && <Link href="/admin" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] hover:bg-mist">Admin panel</Link>}
          <Link href="/account#security" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-[14px] hover:bg-mist">Change password</Link>
          <form action={logout} className="border-t border-ink/10"><button className="w-full px-4 py-2.5 text-left text-[14px] font-medium text-[#d4351c] hover:bg-mist">Sign out</button></form>
        </div>
      )}
    </div>
  );
}
