import type { Metadata } from "next";
import { Suspense } from "react";
import { PROGRAMS } from "@/lib/programs";
import { ApplyForm } from "@/components/apply/apply-form";

export const metadata: Metadata = { title: "Apply", description: "Apply for the Fellowship in Arthroscopy, Next-Gen ACL course or Physiotherapy internship at Arthroscopy College.", alternates: { canonical: "/apply" } };

const STEPS = [["Apply", "3-minute form, no payment"], ["Review", "Coordinator calls within 2 working days"], ["Confirm seat", "Pay the fee via secure link"], ["Join", "Joining details & batch allotted"]];

async function Form({ searchParams }: { searchParams: PageProps<"/apply">["searchParams"] }) {
  const sp = await searchParams;
  const initial = typeof sp.program === "string" && PROGRAMS.some((p) => p.slug === sp.program) ? sp.program : undefined;
  return <ApplyForm programs={PROGRAMS.map((p) => ({ slug: p.slug, title: p.title, audience: p.audience }))} initial={initial} />;
}

export default function Apply({ searchParams }: PageProps<"/apply">) {
  return (
    <div className="page pt-10 md:pt-14">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="label text-brand">Admissions</p>
          <h1 className="mt-3 text-[clamp(2.2rem,1.5rem+2.6vw,3.5rem)] font-semibold leading-[1] tracking-[-0.04em]">Apply to Arthroscopy College</h1>
          <ol className="mt-8 space-y-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-[13px] font-semibold text-white">{i + 1}</span><span><span className="block font-semibold">{t}</span><span className="small">{d}</span></span></li>
            ))}
          </ol>
          <p className="small mt-8">Prefer to talk? Call or WhatsApp <a href="https://wa.me/919650620870" className="text-black underline">+91 96506 20870</a>.</p>
        </div>
        <div className="lg:col-span-8"><Suspense fallback={<div className="min-h-[60vh]" />}><Form searchParams={searchParams} /></Suspense></div>
      </div>
    </div>
  );
}
