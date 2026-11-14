import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/login-form";
import { currentUser, devCodesOnScreen } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

async function Login({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  const raw = typeof sp.next === "string" ? sp.next : "/account";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account"; // no open redirects
  if (await currentUser()) redirect(next);
  const email = typeof sp.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sp.email) ? sp.email : "";
  return <LoginForm next={next} dev={devCodesOnScreen()} initialEmail={email} />;
}

const PERKS = ["Track your application status", "Pay your seat fee securely", "Cohort dates and joining details", "Prep films before you arrive"];

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <div className="page grid gap-6 py-6 lg:min-h-[calc(100dvh-140px)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-[32px] bg-navy lg:block">
        <Image src="/img/cert-1.jpg" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,21,38,.9),rgba(15,21,38,.15)_60%)]" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-teal">Student &amp; staff login</p>
          <p className="mt-3 max-w-[16ch] text-[clamp(2rem,1.4rem+1.6vw,3rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Your seat at the table starts here.</p>
          <ul className="mt-8 space-y-2">
            {PERKS.map((p) => <li key={p} className="flex items-center gap-3 text-[15px]"><span aria-hidden className="size-1.5 rounded-full bg-teal" />{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center py-8 md:py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-72" aria-busy />}>
            <Login searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
