import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { inr } from "@/lib/programs";
import { getPrograms } from "@/lib/program-store";
import { Reveal } from "@/components/college/reveal";

export const metadata: Metadata = { title: "Programmes", description: "Fellowship in Arthroscopy, Next-Gen ACL course, Physiotherapy internship and workshops at Arthroscopy College, Gurugram.", alternates: { canonical: "/programs" } };

export default async function Programs() {
  const PROGRAMS = await getPrograms();
  return (
    <div className="page py-10 text-ink md:py-16">
      <Reveal>
        <h1 className="text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] font-semibold leading-[0.97] tracking-[-0.045em]">Programmes</h1>
        <p className="mt-4 max-w-[56ch] text-[18px] text-ink/65">Hands-on arthroscopy and rehabilitation training for surgeons and physiotherapists, in our operating theatre and clinic in Gurugram.</p>
      </Reveal>
      <ul className="mt-10 space-y-4">
        {PROGRAMS.map((p, i) => (
          <li key={p.slug}>
            <Reveal delay={i * 0.05}>
              <Link href={`/programs/${p.slug}`} className="group grid overflow-hidden rounded-[28px] border border-ink/10 transition-colors hover:border-ink/30 md:grid-cols-[minmax(0,380px)_1fr]">
                <div className="relative aspect-[16/10] overflow-hidden bg-mist md:aspect-auto md:min-h-[240px]"><Image src={p.image} alt="" fill sizes="(min-width:768px) 380px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                <div className="flex flex-col gap-5 p-6 md:p-8 lg:flex-row lg:items-center lg:gap-10">
                  <div className="flex-1">
                    <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-brand">{p.audience}</p>
                    <h2 className="mt-2 text-[clamp(1.4rem,1.1rem+1vw,2rem)] font-semibold leading-tight tracking-[-0.03em] group-hover:text-brand">{p.title}</h2>
                    <p className="mt-3 max-w-[60ch] text-ink/65">{p.short}</p>
                  </div>
                  <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-2 text-[14px] lg:w-[260px] lg:grid-cols-1">
                    <div><dt className="text-ink/45">Duration</dt><dd className="font-semibold">{p.duration}</dd></div>
                    <div><dt className="text-ink/45">Fee</dt><dd className="font-semibold">{p.fee[0] ? `${inr(p.fee[0].amount)} ${p.fee[0].note ?? ""}` : "On request"}</dd></div>
                    <div className="col-span-2 lg:col-span-1"><dt className="text-ink/45">Format</dt><dd className="font-semibold">{p.format}</dd></div>
                  </dl>
                </div>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
