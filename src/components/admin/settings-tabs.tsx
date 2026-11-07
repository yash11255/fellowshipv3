"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const tabs = [["/admin/settings", "General"], ["/admin/settings/seo", "SEO"], ["/admin/settings/payments", "Payments"], ["/admin/settings/taxes", "Taxes"], ["/admin/settings/shipping", "Shipping & delivery"]];

export function SettingsTabs() {
  const p = usePathname();
  return (
    <nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto border-b border-[#e3e3e3]">
      {tabs.map(([href, label]) => (
        <Link key={href} href={href} aria-current={p === href ? "page" : undefined}
          className={clsx("shrink-0 border-b-2 px-3 py-2 text-[14px]", p === href ? "border-black font-semibold" : "border-transparent text-[#4a4a4a] hover:text-black")}>{label}</Link>
      ))}
    </nav>
  );
}
