import Image from "next/image";
import Link from "next/link";
import { FAQS } from "@/lib/programs";
import { VIDEOS } from "@/lib/videos";
import { LiteYouTube } from "@/components/video/lite-youtube";
import { HeroFilm } from "@/components/college/hero-film";
import { Carousel } from "@/components/college/carousel";
import { Reveal } from "@/components/college/reveal";
import { ProgrammeShowcase } from "@/components/college/programme-showcase";

/* Arthroscopy College: editorial, left-aligned, navy ink + teal accent. Film-led, generous whitespace. */

const HOME_FILMS = ["twcQl-uuEqI", "z4kEsuu2lJg", "xeT3dADPSwk", "41ohFGiW_ak", "QILsw563Qss", "kAW51rVWYGA", "R_-23ZdG5h4"];
const titleOf = (id: string) => VIDEOS.find((v) => v.id === id)?.title ?? "Arthroscopy College";

const PROGRAMS = [
  { n: "01", t: "Fellowship in Arthroscopy", d: "One month in the OT. Knee, shoulder, ankle. 30–40 surgeries.", m: "1 month · Gurugram", href: "/programs/fellowship-in-arthroscopy", tags: ["Knee","Shoulder","Ankle","Arthrex certificate"], apply: "/apply?program=fellowship-in-arthroscopy", img: "/img/ot-2.webp" },
  { n: "02", t: "Next-Gen ACL Course", d: "Quad tendon, internal brace and LET, from portals to implants.", m: "5 days · monthly", href: "/programs/advance-acl-course", tags: ["Quad graft","FiberTape","LET","OT assistance"], apply: "/apply?program=advance-acl-course", img: "/img/ot-1.webp" },
  { n: "03", t: "Physiotherapy Internship", d: "ACL rehabilitation with real patients, pre-op to return-to-sport.", m: "1 month · in clinic", href: "/programs/physiotherapy-internship", tags: ["Phase I–V rehab","Real patients","Certificate"], apply: "/apply?program=physiotherapy-internship", img: "/img/faculty-viraj.jpg" },
  { n: "04", t: "ACL Rehab Workshop", d: "Two focused days for physiotherapists, with certification.", m: "2 days · weekend", href: "/programs/acl-rehab-workshop", tags: ["Assessment","Return-to-sport","Certificate"], apply: "/apply?program=acl-rehab-workshop", img: "/img/alumni-8.jpg" },
];

const TRUST = ["Arthrex Master Instructor", "Certificate from Arthrex", "30–40 surgeries every month", "Hands-on in the operating theatre", "Fellows from India and abroad", "Internal-brace specialists", "VR and model training"];

export default async function Home() {
  return (
    <div className="bg-white text-ink">
      {/* Hero: the original site's film, full bleed */}
      <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden text-white">
        <HeroFilm id="gJz1rAvU0n4" poster="/img/ot-1.webp" />
        <div aria-hidden className="absolute inset-0 -z-[5] bg-[linear-gradient(to_top,rgba(15,21,38,.85),rgba(15,21,38,.15)_55%,rgba(15,21,38,.35))]" />
        <div className="page w-full pb-14 pt-32 md:pb-20">
          <p className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-white/80"><span className="live-dot" /> Filmed in our operating theatre</p>
          <h1 className="mt-6 max-w-[13ch] text-[clamp(2.8rem,1.4rem+6vw,7.25rem)] font-semibold leading-[0.95] tracking-[-0.045em]">Train where the surgery happens.</h1>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p className="max-w-[44ch] text-[clamp(1.05rem,0.95rem+0.4vw,1.3rem)] leading-relaxed text-white/85">A one-month arthroscopy fellowship with Dr. Manu Bora, Arthrex Master Instructor. You scrub in, assist and operate.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply?program=fellowship-in-arthroscopy" className="inline-flex h-13 items-center rounded-full bg-teal px-7 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">Apply for the fellowship</Link>
              <Link href="/programs" className="inline-flex h-13 items-center rounded-full border border-white/40 px-7 text-[15px] font-medium text-white backdrop-blur transition-colors hover:bg-white hover:text-ink">See programmes</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust marquee */}
      <div className="overflow-hidden border-b border-ink/10 py-6" aria-label="Why Arthroscopy College">
        <div className="marquee [--marquee-speed:45s]">
          {[...TRUST, ...TRUST].map((t, i) => (
            <span key={i} className="flex items-center gap-10 pr-10 text-[15px] font-medium text-ink/70 whitespace-nowrap">{t}<span aria-hidden className="size-1.5 rounded-full bg-brand" /></span>
          ))}
        </div>
      </div>

      {/* Statement */}
      <section className="page grid gap-10 py-28 md:grid-cols-12 md:py-40">
        <Reveal className="md:col-span-8">
          <p className="text-[clamp(1.9rem,1.2rem+2.6vw,3.5rem)] font-medium leading-[1.12] tracking-[-0.03em]">
            India&apos;s highest volume of ACL internal-brace surgery happens here. <span className="text-ink/40">Our fellows stand at the table for every one of them.</span>
          </p>
        </Reveal>
        <Reveal delay={0.15} className="self-end md:col-span-3 md:col-start-10">
          <dl className="space-y-6 border-l border-ink/15 pl-6">
            {[["30–40", "surgeries a month"], ["1 month", "extendable"], ["Arthrex", "certification"]].map(([n, l]) => (
              <div key={l}><dt className="text-[2rem] font-semibold leading-none tracking-[-0.03em]">{n}</dt><dd className="mt-1 text-[14px] text-ink/60">{l}</dd></div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* Programmes: interactive showcase */}
      <section className="bg-mist py-24 md:py-36">
        <div className="page">
          <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[14ch] text-[clamp(2.2rem,1.4rem+2.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Four ways to train with us.</h2>
            <Link href="/programs" className="text-[15px] font-semibold text-brand hover:underline">Compare all programmes →</Link>
          </Reveal>
          <Reveal delay={0.1}><ProgrammeShowcase items={PROGRAMS} /></Reveal>
        </div>
      </section>

      {/* Dr. Bora: split portrait */}
      <section className="page grid items-center gap-12 py-28 md:grid-cols-2 md:gap-20 md:py-40">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-mist">
            <Image src="/brand/dr-manu-bora.jpg" alt="Dr. Manu Bora" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover object-top" />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <h2 className="text-[clamp(2.2rem,1.4rem+3vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Taught by Dr. Manu Bora.</h2>
          <p className="mt-6 max-w-[46ch] text-[18px] leading-relaxed text-ink/70">Orthopaedic and arthroscopy surgeon and Arthrex Master Instructor, known for all-inside ACL and PCL reconstruction with FiberTape internal brace. He operates, explains every step and lets you do the work.</p>
          <blockquote className="mt-10 border-l-2 border-teal pl-6 text-[20px] font-medium leading-snug tracking-[-0.01em]">&ldquo;The best way to learn surgery is to be in surgery.&rdquo;</blockquote>
          <Link href="/dr-manu-bora" className="mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-brand hover:gap-3 transition-all">Read his story <span aria-hidden>→</span></Link>
        </Reveal>
      </section>

      {/* Films carousel, dark */}
      <section className="bg-ink py-24 text-white md:py-32">
        <div className="page mb-12 flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="max-w-[18ch] text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">From the theatre, unedited.</h2></Reveal>
          <Link href="/videos" className="text-[15px] font-semibold text-teal hover:underline">All {VIDEOS.length} films →</Link>
        </div>
        <Carousel label="Fellowship films" dark itemClass="w-[82vw] sm:w-[480px]">
          {HOME_FILMS.map((id) => (
            <figure key={id}>
              <LiteYouTube id={id} title={titleOf(id)} />
              <figcaption className="mt-4 line-clamp-2 text-[16px] font-medium leading-snug text-white/85">{titleOf(id)}</figcaption>
            </figure>
          ))}
        </Carousel>
      </section>

      {/* Fellows carousel */}
      <section className="py-24 md:py-32">
        <div className="page mb-12 flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold tracking-[-0.035em]">Certified every month.</h2></Reveal>
          <Link href="/gallery" className="text-[15px] font-semibold text-brand hover:underline">Gallery →</Link>
        </div>
        <Carousel label="Our fellows" itemClass="w-[64vw] sm:w-[300px]">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-mist">
              <Image src={`/img/alumni-${i}.jpg`} alt="Fellow receiving a certificate from Dr. Manu Bora" fill sizes="300px" className="object-cover" />
            </div>
          ))}
        </Carousel>
      </section>

      {/* FAQ: two-column */}
      <section className="page grid gap-12 border-t border-ink/10 py-24 md:grid-cols-12 md:py-32">
        <Reveal className="md:col-span-4"><h2 className="text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold tracking-[-0.035em]">Questions, answered.</h2><p className="mt-4 text-ink/60">Something else? <Link href="/contact-us" className="text-brand hover:underline">Talk to us</Link>.</p></Reveal>
        <div className="divide-y divide-ink/10 border-y border-ink/10 md:col-span-7 md:col-start-6">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-medium [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/15 transition-transform duration-300 group-open:rotate-45">+</span></summary>
              <p className="mt-4 max-w-[62ch] leading-relaxed text-ink/65">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src="/img/ot-2.webp" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-25" />
        <div className="page py-28 md:py-40">
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(2.4rem,1.4rem+4vw,5rem)] font-semibold leading-[1] tracking-[-0.045em]">A few seats. Every month.</h2>
            <p className="mt-6 max-w-[40ch] text-[18px] text-white/75">Apply in three minutes. Our team calls you within two working days.</p>
            <Link href="/apply" className="mt-10 inline-flex h-13 items-center rounded-full bg-teal px-8 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">Start your application</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
