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
  return <LoginForm next={next} dev={devCodesOnScreen()} />;
}

const PERKS = ["Track orders and deliveries", "Reorder your stack in one tap", "Saved address for faster checkout", "Members-only offers"];

export default function Page({ searchParams }: PageProps<"/login">) {
  return (
    <div className="grid min-h-[calc(100dvh-108px)] lg:grid-cols-2">
      <div className="relative hidden bg-[#1a1a1a] lg:block">
        <Image src="/lifestyle/longevity.jpg" alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="label text-white/70">Your Reverse account</p>
          <p className="hd-1 mt-3 max-w-[14ch]">Small daily choices. Compounded.</p>
          <ul className="mt-8 space-y-2">
            {PERKS.map((p) => <li key={p} className="flex items-center gap-3 text-[15px]"><span aria-hidden className="size-1.5 bg-brand" />{p}</li>)}
          </ul>
        </div>
      </div>
      <div className="flex items-start justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-72" aria-busy />}>
            <Login searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
