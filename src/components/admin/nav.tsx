"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const items = [
  { href: "/admin", label: "Dashboard", d: "M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 4v4h6V4z" },
  { href: "/admin/applications", label: "Applications", d: "M8 4h8l3 3v13H5V4h3zM8 11h8M8 15h5" },
  { href: "/admin/orders", label: "Orders", d: "M5 7h14l-1.2 12H6.2L5 7zM9 7V5a3 3 0 0 1 6 0v2" },
  { href: "/admin/products", label: "Products", d: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5" },
  { href: "/admin/customers", label: "Customers", d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" },
  { href: "/admin/discounts", label: "Discounts", d: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01" },
  { href: "/admin/returns", label: "Returns", d: "M4 12a8 8 0 1 0 3-6.2M4 4v4h4" },
  { href: "/admin/abandoned", label: "Abandoned carts", d: "M5 8h14l-1.2 12H6.2L5 8zM9 8V6a3 3 0 0 1 6 0v2M10 13l4 4M14 13l-4 4" },
  { href: "/admin/content", label: "Content", d: "M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6" },
  { href: "/admin/inbox", label: "Inbox", d: "M3 13l3-8h12l3 8v6H3zM3 13h5l1 2h6l1-2h5" },
  { href: "/admin/reviews", label: "Reviews", d: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" },
  { href: "/admin/staff", label: "Staff", d: "M16 11a4 4 0 1 0-8 0M4 21c1-4 4-6 8-6s7 2 8 6M19 8v4M17 10h4" },
  { href: "/admin/settings", label: "Settings", d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
      {items.map((it) => {
        const active = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}
            className={clsx("flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors",
              active ? "bg-[#ebebeb] font-semibold" : "text-[#303030] hover:bg-[#f1f1f1]")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d={it.d} /></svg>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
