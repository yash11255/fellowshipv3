import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/college/reveal";
import { Parallax } from "@/components/college/parallax";
import { FilmTheatre } from "@/components/college/film-theatre";
import { PhotoWall, COLLEGE_PHOTOS } from "@/components/college/photo-wall";
import { FEATURED_VIDEOS } from "@/lib/videos";

export const metadata: Metadata = {
  title: "Dr. Manu Bora: Arthroscopy & Sports Injury Surgeon, Arthrex Master Instructor",
  description: "Dr. Manu Bora, MBBS, MS (Ortho), is an arthroscopy and sports-injury surgeon in Gurugram and Master Instructor at Arthrex India, known for all-inside ACL/PCL reconstruction with FiberTape internal brace.",
  alternates: { canonical: "/dr-manu-bora" },
};

// Source: arthroscopycollege.com/dr-manu-bora
const PROCEDURES = ["All-inside ACL / PCL reconstruction with FiberTape internal brace", "All-inside ACL / PCL repair with FiberTape internal brace", "Percutaneous cartilage, ligament and tendon regeneration", "Cartilage transplantation: Graftnet, AutoCart", "Shoulder arthroscopy: rotator cuff & Bankart repair", "Knee arthroscopy and ligament reconstruction", "Ankle ATFL / CFL repair with FiberTape internal brace"];
const ROLES = ["Master Instructor, Arthrex India", "Consultant, Orthosport, Gurugram", "Consultant, Aashlok Hospital, New Delhi", "Consultant, Criti Care, Mumbai"];
const MEMBERSHIPS = ["ISAKOS", "Asian Arthroscopy Society", "Indian Orthopaedic Association", "Indian Arthroscopy Society", "Indian Association of Sports Medicine", "Indian Federation of Sports Medicine", "Delhi Orthopaedic Association"];
const AWARDS = [["2020", "Most Inspiring and Successful Sports Injury Surgeon"], ["2020", "Nation's Pride Award, Artemis Hospital, Gurugram"], ["2019", "Innovative Orthopaedics & Sports Injury Surgeon of the Year (GLAPEB)"], ["2019", "Indian Healthcare Excellence Award"], ["2019", "Medallion of Honour, Indo-Nepal Peace Exchange"], ["2018", "Best Sports Injury Expert in Delhi NCR"]];

export default function DrBora() {
  const ld = { "@context": "https://schema.org", "@type": "Physician", name: "Dr. Manu Bora", medicalSpecialty: "Orthopedic", image: "/brand/dr-manu-bora.jpg", address: { "@type": "PostalAddress", streetAddress: "F-10/4, Golf Course Rd, DLF Phase 1, Sector 27", addressLocality: "Gurugram", addressRegion: "Haryana", postalCode: "122001", addressCountry: "IN" } };
  return (
    <div className="text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="page pt-4 md:pt-6">
        <div className="grid overflow-hidden rounded-[32px] bg-navy text-white md:rounded-[40px] lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col justify-center gap-6 p-6 sm:p-10 lg:p-14">
            <Reveal>
              <p className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-teal"><span className="h-px w-8 bg-teal" />MBBS, MS (Orthopaedics)</p>
              <h1 className="mt-5 text-[clamp(2.6rem,1.6rem+3.6vw,5rem)] font-semibold leading-[0.95] tracking-[-0.045em]">Dr. Manu Bora</h1>
              <p className="mt-5 max-w-[48ch] text-[17px] leading-relaxed text-white/75">Arthroscopy and sports-injury surgeon for the knee, shoulder and ankle, and one of the few surgeons in India practising all-inside ACL and PCL reconstruction with FiberTape internal brace. Master Instructor at Arthrex India and director of Arthroscopy College.</p>
            </Reveal>
            <Reveal delay={0.1}>
              <dl className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
                <div className="bg-navy p-4"><dt className="text-[13px] text-white/50">Specialty</dt><dd className="mt-1 font-semibold">Sports injury, arthroscopy & ACL</dd></div>
                <div className="bg-navy p-4"><dt className="text-[13px] text-white/50">OPD in Gurugram</dt><dd className="mt-1 font-semibold">Mon & Wed, 11am–1pm</dd></div>
              </dl>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/programs/fellowship-in-arthroscopy" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[14px] font-semibold text-ink">Train with Dr. Bora</Link>
                <a href="https://wa.me/919650620870?text=Hi%2C%20I%27d%20like%20an%20appointment%20with%20Dr.%20Manu%20Bora" target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 text-[14px] font-semibold hover:bg-white/10">Book an appointment</a>
              </div>
            </Reveal>
          </div>
          <Parallax className="relative order-first h-[380px] sm:h-[520px] lg:order-none lg:h-auto lg:min-h-[640px]">
            <Image src="/brand/dr-manu-bora.jpg" alt="Dr. Manu Bora" fill priority sizes="(min-width:1024px) 48vw, 100vw" className="object-cover object-top" />
          </Parallax>
        </div>
      </section>

      <section className="page grid gap-10 py-16 md:py-20 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <h2 className="text-[clamp(1.9rem,1.3rem+1.8vw,3rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Procedures he performs and teaches</h2>
          <p className="mt-4 max-w-[44ch] text-ink/65">He has also mastered cartilage transplant, multi-ligament and complex shoulder surgery. Fellows assist on these cases every week.</p>
        </Reveal>
        <ol className="divide-y divide-ink/10 border-y border-ink/10 lg:col-span-7">
          {PROCEDURES.map((p, i) => (
            <Reveal key={p} delay={i * 0.04}><li className="flex items-baseline gap-5 py-4 text-[17px]"><span className="text-[13px] tabular-nums text-brand">{String(i + 1).padStart(2, "0")}</span>{p}</li></Reveal>
          ))}
        </ol>
      </section>

      <section className="page grid gap-4 pb-16 md:grid-cols-3 md:pb-20">
        {[["Roles", ROLES], ["Memberships", MEMBERSHIPS]].map(([t, l]) => (
          <Reveal key={t as string}><div className="h-full rounded-[28px] bg-mist p-7 md:p-9"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">{t as string}</h2><ul className="mt-5 space-y-2.5 text-[15px] text-ink/75">{(l as string[]).map((x) => <li key={x}>{x}</li>)}</ul></div></Reveal>
        ))}
        <Reveal delay={0.1}><div className="h-full rounded-[28px] bg-ink p-7 text-white md:p-9"><h2 className="text-[22px] font-semibold tracking-[-0.02em]">Awards</h2><ul className="mt-5 space-y-3 text-[15px]">{AWARDS.map(([y, a]) => <li key={a} className="flex gap-4"><span className="text-teal tabular-nums">{y}</span><span className="text-white/80">{a}</span></li>)}</ul></div></Reveal>
      </section>

      <section className="page pb-16 md:pb-20">
        <Reveal><div className="rounded-[28px] border border-ink/10 p-7 md:p-10"><p className="max-w-[70ch] text-[clamp(1.1rem,1rem+0.4vw,1.35rem)] leading-relaxed text-ink/80">Beyond the theatre, Dr. Bora runs free sessions on injury prevention and endurance for athletes, the CRPF, BSF and police, works with sports clubs and government sports authorities, and gives free office-ergonomics talks at companies.</p></div></Reveal>
      </section>

      <section className="page pb-6">
        <div className="rounded-[32px] bg-ink px-5 py-10 text-white sm:px-10 md:rounded-[40px] md:py-14 lg:px-14">
          <h2 className="mb-8 text-[clamp(1.9rem,1.3rem+1.8vw,3rem)] font-semibold tracking-[-0.035em]">In the theatre</h2>
          <FilmTheatre films={FEATURED_VIDEOS.map((v) => ({ id: v.id, title: v.title }))} />
        </div>
      </section>

      <section className="page py-16 md:py-20">
        <h2 className="mb-8 text-[clamp(1.9rem,1.3rem+1.8vw,3rem)] font-semibold tracking-[-0.035em]">With his fellows</h2>
        <PhotoWall photos={COLLEGE_PHOTOS} />
      </section>
    </div>
  );
}
