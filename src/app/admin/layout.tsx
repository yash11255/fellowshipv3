import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { requireStaff } from "@/lib/admin";
import { AdminNav } from "@/components/admin/nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false } };

async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <div className="min-h-dvh bg-[#f6f6f7] text-black lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/admin" aria-label="Admin home"><Logo className="h-6 w-auto" /></Link>
          <Link href="/" className="text-[12px] text-grey hover:text-black">View store ↗</Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 pb-5 text-[12px] text-grey lg:absolute lg:bottom-0 lg:block">
          <p className="truncate font-medium text-black">{user.email}</p>
          <p className="capitalize">{user.role}</p>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f6f6f7]" aria-busy />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
