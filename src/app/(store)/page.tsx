import Image from "next/image";
import Link from "next/link";
import { FAQS } from "@/lib/programs";
import { VIDEOS } from "@/lib/videos";
import { LiteYouTube } from "@/components/video/lite-youtube";
import { HeroFilm } from "@/components/college/hero-film";
import { Reveal } from "@/components/college/reveal";
import { Parallax } from "@/components/college/parallax";
import { FilmTheatre } from "@/components/college/film-theatre";
import { PhotoWall, COLLEGE_PHOTOS } from "@/components/college/photo-wall";
import { ProgrammeShowcase } from "@/components/college/programme-showcase";

/* Arthroscopy College: editorial, left-aligned, navy ink + teal accent. Film-led, generous whitespace. */

const HOME_FILMS = ["twcQl-uuEqI", "z4kEsuu2lJg", "xeT3dADPSwk", "41ohFGiW_ak", "QILsw563Qss", "kAW51rVWYGA", "R_-23ZdG5h4"];
const titleOf = (id: string) => VIDEOS.find((v) => v.id === id)?.title ?? "Arthroscopy College";

const PROGRAMS = [
  { n: "01", t: "Fellowship in Arthroscopy", d: "One month in the OT. Knee, shoulder, ankle. 30–40 surgeries.", m: "1 month · Gurugram", href: "/programs/fellowship-in-arthroscopy", tags: ["Knee","Shoulder","Ankle","Arthrex certificate"], apply: "/apply?program=fellowship-in-arthroscopy", img: "/img/ot-2.webp" },
  { n: "02", t: "Next-Gen ACL Course", d: "Quad tendon, internal brace and LET, from portals to implants.", m: "5 days · monthly", href: "/programs/advance-acl-course", tags: ["Quad graft","FiberTape","LET","OT assistance"], apply: "/apply?program=advance-acl-course", img: "/img/ot-1.webp" },
  { n: "03", t: "Physiotherapy Internship", d: "ACL rehabilitation with real patients, pre-op to return-to-sport.", m: "1 month · in clinic", href: "/programs/physiotherapy-internship", tags: ["Phase I–V rehab","Real patients","Certificate"], apply: "/apply?program=physiotherapy-internship", img: "/img/team-1.jpg" },
  { n: "04", t: "ACL Rehab Workshop", d: "Two focused days for physiotherapists, with certification.", m: "2 days · weekend", href: "/programs/acl-rehab-workshop", tags: ["Assessment","Return-to-sport","Certificate"], apply: "/apply?program=acl-rehab-workshop", img: "/img/clinic-1.jpg" },
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
          <h1 className="mt-5 max-w-[13ch] text-[clamp(2.8rem,1.4rem+6vw,7.25rem)] font-semibold leading-[0.95] tracking-[-0.045em]">Train where the surgery happens.</h1>
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
          <p className="text-[clamp(1.75rem,1.2rem+2vw,3rem)] font-medium leading-[1.12] tracking-[-0.03em]">
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
      <section className="bg-mist py-16 md:py-20">
        <div className="page">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-[14ch] text-[clamp(2.2rem,1.4rem+2.6vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Four ways to train with us.</h2>
            <Link href="/programs" className="text-[15px] font-semibold text-brand hover:underline">Compare all programmes →</Link>
          </Reveal>
          <Reveal delay={0.1}><ProgrammeShowcase items={PROGRAMS} /></Reveal>
        </div>
      </section>

      {/* Dr. Bora: dark feature with parallax portrait */}
      <section className="py-4 md:py-6">
        <div className="page">
          <div className="relative overflow-hidden rounded-[32px] bg-navy text-white md:rounded-[40px]">
            <div className="grid lg:grid-cols-[1.05fr_1fr]">
              <div className="relative z-10 flex flex-col justify-between gap-8 p-8 sm:p-10 lg:p-12 xl:p-14">
                <Reveal>
                  <p className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-teal"><span className="h-px w-8 bg-teal" />Your mentor</p>
                  <h2 className="mt-6 text-[clamp(2.4rem,1.6rem+2.8vw,4rem)] font-semibold leading-[0.95] tracking-[-0.045em]">Dr. Manu<br />Bora</h2>
                  <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/70">Orthopaedic and arthroscopy surgeon in Gurugram, and one of India&apos;s leading voices on internal-brace ligament surgery. In his theatre, fellows don&apos;t watch from the gallery. They scrub in.</p>
                </Reveal>
                <Reveal delay={0.1}>
                  <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
                    {[["Master Instructor", "Arthrex"], ["Highest volume", "ACL internal brace in India"], ["All-inside", "ACL & PCL reconstruction"]].map(([k, v]) => (
                      <div key={k} className="bg-navy px-5 py-4"><dt className="text-[17px] font-semibold tracking-[-0.01em]">{k}</dt><dd className="mt-1 text-[14px] text-white/55">{v}</dd></div>
                    ))}
                  </dl>
                </Reveal>
                <Reveal delay={0.2}>
                  <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/45">Operates on</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {["ACL / PCL", "Meniscus", "MCL / LCL", "Cartilage (AutoCart)", "Rotator cuff", "Bankart", "ATFL"].map((t) => <li key={t} className="rounded-full border border-white/15 px-4 py-1.5 text-[14px] text-white/80 transition-colors hover:border-teal hover:text-teal">{t}</li>)}
                  </ul>
                  <div className="mt-7 flex flex-wrap items-center gap-6">
                    <Link href="/dr-manu-bora" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-[14px] font-semibold text-ink transition-transform hover:-translate-y-0.5">Meet Dr. Bora</Link>
                    <Link href="/videos" className="group inline-flex items-center gap-3 text-[14px] font-semibold"><span className="grid size-10 place-items-center rounded-full border border-white/30 transition-colors group-hover:bg-teal group-hover:text-ink"><svg width="10" height="10" viewBox="0 0 12 12" aria-hidden><path d="M3 1l8 5-8 5z" fill="currentColor" /></svg></span>Watch him operate</Link>
                  </div>
                </Reveal>
              </div>
              <Parallax className="relative min-h-[420px] lg:min-h-full">
                <Image src="/brand/dr-manu-bora.jpg" alt="Dr. Manu Bora" fill sizes="(min-width:1024px) 48vw, 100vw" className="object-cover object-top" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-navy),transparent_30%)] max-lg:bg-[linear-gradient(to_bottom,var(--color-navy),transparent_25%)]" />
              </Parallax>
            </div>
          </div>
        </div>
      </section>

      {/* Films: featured player + playlist */}
      <section className="bg-ink py-16 text-white md:py-20">
        <div className="page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <Reveal>
              <p className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.18em] text-teal"><span className="live-dot" />From the theatre</p>
              <h2 className="mt-4 max-w-[20ch] text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Real surgeries. Real fellows. Unedited.</h2>
            </Reveal>
            <Link href="/videos" className="inline-flex h-11 items-center rounded-full border border-white/25 px-5 text-[14px] font-semibold transition-colors hover:bg-white hover:text-ink">All {VIDEOS.length} films →</Link>
          </div>
          <Reveal delay={0.1}><FilmTheatre films={["gJz1rAvU0n4", ...HOME_FILMS].map((id) => ({ id, title: titleOf(id) }))} /></Reveal>
        </div>
      </section>

      {/* Life at the college: real photos */}
      <section className="page py-16 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <Reveal><h2 className="max-w-[18ch] text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Certified every month, in person.</h2></Reveal>
          <Link href="/gallery" className="text-[15px] font-semibold text-brand hover:underline">Full gallery →</Link>
        </div>
        <PhotoWall photos={COLLEGE_PHOTOS} />
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
        <div className="page py-16 md:py-24">
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
