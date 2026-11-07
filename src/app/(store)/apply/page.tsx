import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getPrograms } from "@/lib/program-store";
import { currentUser } from "@/lib/auth";
import { ApplyForm } from "@/components/apply/apply-form";

export const metadata: Metadata = { title: "Apply", description: "Apply for the Fellowship in Arthroscopy, Next-Gen ACL course or Physiotherapy internship at Arthroscopy College.", alternates: { canonical: "/apply" } };

const STEPS = [["Apply", "3-minute form, no payment"], ["Review", "Coordinator calls within 2 working days"], ["Confirm seat", "Pay the fee via secure link"], ["Join", "Joining details & batch allotted"]];

async function Form({ searchParams }: { searchParams: PageProps<"/apply">["searchParams"] }) {
  const sp = await searchParams;
  const PROGRAMS = await getPrograms();
  const initial = typeof sp.program === "string" && PROGRAMS.some((p) => p.slug === sp.program) ? sp.program : undefined;
  const user = await currentUser();
  return <ApplyForm signedInEmail={user?.email} programs={PROGRAMS.map((p) => ({ slug: p.slug, title: p.title, audience: p.audience }))} initial={initial} />;
}

export default function Apply({ searchParams }: PageProps<"/apply">) {
  return (
    <div className="page py-10 text-ink md:py-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <h1 className="text-[clamp(2.4rem,1.5rem+2.8vw,4rem)] font-semibold leading-[0.97] tracking-[-0.045em]">Apply to Arthroscopy College</h1>
          <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-[24px] lg:block"><Image src="/img/cert-1.jpg" alt="Fellow receiving a certificate from Dr. Manu Bora" fill sizes="30vw" className="object-cover" /></div>
          <ol className="mt-8 space-y-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-white">{i + 1}</span><span><span className="block font-semibold">{t}</span><span className="text-[14px] text-ink/55">{d}</span></span></li>
            ))}
          </ol>
          <p className="mt-8 text-[14px] text-ink/60">Prefer to talk? Call or WhatsApp <a href="https://wa.me/919650620870" className="font-semibold text-ink underline">+91 96506 20870</a>.</p>
        </div>
        <div className="lg:col-span-8"><Suspense fallback={<div className="min-h-[60vh]" />}><Form searchParams={searchParams} /></Suspense></div>
      </div>
    </div>
  );
}
