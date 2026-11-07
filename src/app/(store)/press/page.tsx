import type { Metadata } from "next";
import { PRESS } from "@/lib/press";
import Image from "next/image";

export const metadata: Metadata = { title: "Press", description: "Dr. Manu Bora and Reverse Clinics in Hindustan Times, The Hindu, Times of India, The New Indian Express and more.", alternates: { canonical: "/press" } };

export default function Press() {
  return (
    <div className="page pt-8 md:pt-12">
      <h1 className="hd-1">Press</h1>
      <p className="body mt-2 max-w-[60ch]">Dr. Manu Bora on nutrition, ageing and sports medicine in India&apos;s leading publications.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRESS.map((p) => (
          <li key={p.href + p.headline}>
            <a href={p.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col border border-line hover:border-black">
              <div className="relative h-32 border-b border-line"><Image src={p.logo} alt={p.outlet} fill sizes="33vw" className="object-contain p-6" /></div>
              <div className="flex flex-1 flex-col p-5"><p className="label text-grey">{p.outlet}</p><p className="mt-2 text-[16px] font-semibold leading-snug">{p.headline}</p><span className="mt-auto pt-4 text-[13px] group-hover:underline">Read the feature ↗</span></div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
