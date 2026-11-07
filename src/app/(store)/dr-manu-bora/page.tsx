import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PRESS } from "@/lib/press";

export const metadata: Metadata = { title: "Dr. Manu Bora", description: "Orthopaedic surgeon, arthroscopy and sports-medicine specialist, Arthrex Master Instructor, and the formulator behind Reverse Clinics.", alternates: { canonical: "/dr-manu-bora" } };

export default function Doctor() {
  const ld = { "@context": "https://schema.org", "@type": "Person", name: "Dr. Manu Bora", jobTitle: "Orthopaedic Surgeon", description: "Arthroscopy & sports medicine specialist, Arthrex Master Instructor", worksFor: { "@type": "Organization", name: "Reverse Clinics" } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="bg-[#f6e7da]">
        <div className="page grid items-center gap-8 py-12 md:grid-cols-2 md:py-0">
          <div className="md:py-20">
            <p className="label">The formulator</p>
            <h1 className="hd-display mt-4">Dr. Manu Bora</h1>
            <p className="mt-4 text-[17px] font-medium">Orthopaedic surgeon · Arthroscopy &amp; sports medicine · Arthrex Master Instructor</p>
            <p className="body mt-6 max-w-[50ch] text-[16px] text-black/75">After years of repairing joints and sports injuries, Dr. Bora set out to act earlier: at the cellular processes behind ageing, recovery and energy. Every Reverse formula is built on that idea, with doses based on published research and nothing hidden in proprietary blends.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/clinic" className="inline-flex h-12 items-center bg-black px-7 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Book a consultation</Link><Link href="/shop" className="inline-flex h-12 items-center border border-black px-7 text-[12px] font-semibold uppercase tracking-[0.06em]">Shop his formulas</Link></div>
          </div>
          <div className="relative aspect-square md:aspect-[4/5]"><Image src="/brand/Dr._Manu_Bora.png" alt="Dr. Manu Bora" fill priority sizes="50vw" className="object-cover object-[85%_top]" /></div>
        </div>
      </section>
      <section className="page pt-20">
        <h2 className="hd-1">In the press</h2>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {PRESS.map((p) => (
            <li key={p.href + p.headline}><a href={p.href} target="_blank" rel="noopener noreferrer" className="flex flex-wrap items-baseline justify-between gap-2 py-4 hover:underline"><span className="text-[16px] font-semibold">{p.headline}</span><span className="small">{p.outlet} ↗</span></a></li>
          ))}
        </ul>
      </section>
    </>
  );
}
