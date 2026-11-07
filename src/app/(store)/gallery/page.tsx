import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/college/reveal";
import { PhotoWall, type Photo } from "@/components/college/photo-wall";

export const metadata: Metadata = { title: "Gallery", description: "Fellows in the operating theatre and on graduation day at Arthroscopy College, Gurugram.", alternates: { canonical: "/gallery" } };

const THEATRE: Photo[] = [
  { src: "/img/ot-1.webp", alt: "Fellows operating with Dr. Manu Bora", wide: true },
  { src: "/img/ot-2.webp", alt: "Arthroscopic surgery in progress", wide: true },
];
const CERTS: Photo[] = [
  ...[2, 3, 4, 5, 6, 7].map((i) => ({ src: `/img/cert-${i}.jpg`, alt: "Fellow receiving a certificate from Dr. Manu Bora", tall: true })),
  { src: "/img/cert-1.jpg", alt: "Certificate ceremony", wide: true },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ src: `/img/alumni-${i}.jpg`, alt: "Fellowship graduate with Dr. Manu Bora", tall: i % 3 === 0 })),
];
const TEAM: Photo[] = [
  { src: "/img/team-1.jpg", alt: "Physiotherapist, Threads Physio", tall: true },
  { src: "/img/team-2.jpg", alt: "Physiotherapist, Threads Physio", tall: true },
  { src: "/img/clinic-1.jpg", alt: "Head physiotherapist at the clinic", wide: true },
  { src: "/img/team-4.jpg", alt: "Physiotherapy team" },
  { src: "/img/team-3.jpg", alt: "Physiotherapist" },
  { src: "/img/faculty-viraj.jpg", alt: "Dr. Viraj Pandya", wide: true },
];

export default function Gallery() {
  return (
    <div className="text-ink">
      <section className="page pb-10 pt-10 md:pt-16">
        <Reveal>
          <h1 className="text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] font-semibold leading-[0.97] tracking-[-0.045em]">Gallery</h1>
          <p className="mt-5 max-w-[50ch] text-[18px] text-ink/65">Every month a new group of surgeons and physiotherapists trains with us. These are their days in the OT and their graduation days.</p>
        </Reveal>
      </section>
      {[["In the operating theatre", THEATRE], ["Graduation day", CERTS], ["Faculty & clinic", TEAM]].map(([t, ps]) => (
        <section key={t as string} className="page pb-14 md:pb-16">
          <h2 className="mb-6 text-[clamp(1.6rem,1.2rem+1.2vw,2.25rem)] font-semibold tracking-[-0.03em]">{t as string}</h2>
          <PhotoWall photos={ps as Photo[]} />
        </section>
      ))}
      <section className="page pb-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[32px] bg-navy p-8 text-white md:flex-row md:items-center md:p-12">
          <p className="max-w-[24ch] text-[clamp(1.6rem,1.2rem+1.4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em]">Your photo could be next month&apos;s.</p>
          <Link href="/apply" className="inline-flex h-12 items-center rounded-full bg-teal px-7 text-[15px] font-semibold text-ink">Apply now</Link>
        </div>
      </section>
    </div>
  );
}
