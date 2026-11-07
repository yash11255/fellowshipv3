import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PROGRAMS, inr } from "@/lib/programs";

export const metadata: Metadata = { title: "Programs", description: "Fellowship in Arthroscopy, Next-Gen ACL course, Physiotherapy internship and workshops at Arthroscopy College, Gurugram.", alternates: { canonical: "/programs" } };

export default function Programs() {
  return (
    <div className="page pt-10 md:pt-14">
      <p className="label text-brand">Programs</p>
      <h1 className="mt-3 text-[clamp(2.2rem,1.5rem+2.6vw,3.75rem)] font-semibold tracking-[-0.04em]">Training programs</h1>
      <p className="body mt-3 max-w-[60ch] text-[16px]">Hands-on arthroscopy and rehabilitation training for surgeons and physiotherapists.</p>
      <ul className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {PROGRAMS.map((p) => (
          <li key={p.slug}>
            <Link href={`/programs/${p.slug}`} className="group flex h-full flex-col border border-line hover:border-navy">
              <div className="relative aspect-[16/9] overflow-hidden bg-tile"><Image src={p.image} alt="" fill sizes="(min-width:1280px) 33vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /></div>
              <div className="flex flex-1 flex-col p-6">
                <p className="small">{p.audience}</p>
                <h2 className="mt-2 text-[20px] font-semibold leading-tight group-hover:underline">{p.title}</h2>
                <p className="body mt-2 line-clamp-3">{p.short}</p>
                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-[13px]">
                  <div><dt className="text-grey">Duration</dt><dd className="font-semibold">{p.duration}</dd></div>
                  <div><dt className="text-grey">Fee</dt><dd className="font-semibold">{p.fee[0] ? inr(p.fee[0].amount) : "On request"}</dd></div>
                </dl>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
