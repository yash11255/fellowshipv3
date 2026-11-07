import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PROGRAMS, inr, FAQS } from "@/lib/programs";
import { getPrograms, getProgramBySlug } from "@/lib/program-store";
import { FEATURED_VIDEOS } from "@/lib/videos";
import { getSeo } from "@/lib/settings";
import { Reveal } from "@/components/college/reveal";
import { Parallax } from "@/components/college/parallax";
import { Curriculum } from "@/components/college/curriculum";
import { FilmTheatre } from "@/components/college/film-theatre";
import { PhotoWall, COLLEGE_PHOTOS, type Photo } from "@/components/college/photo-wall";

type P = PageProps<"/programs/[slug]">;
export function generateStaticParams() { return PROGRAMS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await getProgramBySlug((await params).slug);
  return p ? { title: p.title, description: p.short, alternates: { canonical: `/programs/${p.slug}` }, openGraph: { images: [p.image] } } : {};
}

const REHAB_PHOTOS: Photo[] = [
  { src: "/img/team-2.jpg", alt: "Physiotherapist at Threads Physio", tall: true },
  { src: "/img/clinic-1.jpg", alt: "Head physiotherapist at the clinic", wide: true },
  { src: "/img/faculty-viraj.jpg", alt: "Dr. Viraj Pandya", tall: true },
  { src: "/img/team-4.jpg", alt: "Physiotherapy team" },
  { src: "/img/team-3.jpg", alt: "Physiotherapist" },
  { src: "/img/team-1.jpg", alt: "Physiotherapist", tall: true },
  { src: "/img/cert-1.jpg", alt: "Certificate ceremony", wide: true },
  { src: "/img/cert-4.jpg", alt: "Completion certificate", tall: true },
];

const WA = "https://wa.me/919650620870?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20the%20program";

async function ProgramBody({ params }: { params: P["params"] }) {
  const p = await getProgramBySlug((await params).slug);
  if (!p || !p.published) notFound();
  const { siteUrl } = await getSeo();
  const apply = `/apply?program=${p.slug}`;
  const ld = {
    "@context": "https://schema.org", "@type": "Course", name: p.title, description: p.short,
    provider: { "@type": "Organization", name: "Arthroscopy College", sameAs: siteUrl },
    ...(p.fee[0] ? { offers: { "@type": "Offer", price: p.fee[0].amount, priceCurrency: "INR", category: "Paid" } } : {}),
    hasCourseInstance: { "@type": "CourseInstance", courseMode: p.format.startsWith("Online") ? "online" : "onsite", location: "Gurugram, Haryana, India", courseWorkload: p.duration },
  };
  const facts = [["Duration", p.duration], ["Format", p.format], ["For", p.audience], ...(p.schedule ? [["Runs", p.schedule]] : [])];
  const others = (await getPrograms()).filter((o) => o.slug !== p.slug).slice(0, 3);
  const films = FEATURED_VIDEOS.map((v) => ({ id: v.id, title: v.title }));
  const surgeon = !p.slug.includes("physio") && !p.slug.includes("rehab");

  return (
    <div className="text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* Hero */}
      <section className="page grid gap-10 pb-12 pt-8 md:pt-12 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16 lg:pb-16">
        <Reveal>
          <nav className="flex items-center gap-2 text-[13px] text-ink/50"><Link href="/programs" className="hover:text-ink">Programmes</Link><span aria-hidden>/</span><span className="truncate text-ink/80">{p.title}</span></nav>
          <h1 className="mt-6 text-[clamp(2.3rem,1.4rem+3.2vw,4.25rem)] font-semibold leading-[0.97] tracking-[-0.045em]">{p.title}</h1>
          <p className="mt-7 max-w-[48ch] text-[clamp(1.05rem,0.95rem+0.4vw,1.3rem)] leading-relaxed text-ink/65">{p.short}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href={apply} className="inline-flex h-13 items-center rounded-full bg-ink px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand">Apply now</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center rounded-full border border-ink/15 px-7 text-[15px] font-medium transition-colors hover:border-ink">Ask on WhatsApp</a>
          </div>
          {p.nextDates && p.nextDates.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.14em] text-ink/50"><span className="live-dot" />Next batches</span>
              {p.nextDates.map((d) => <span key={d} className="rounded-full bg-mist px-3 py-1 text-[14px] font-semibold">{d}</span>)}
            </div>
          )}
        </Reveal>
        <Reveal delay={0.1}>
          <Parallax amount={40} className="relative aspect-[4/3] rounded-[28px] bg-mist lg:aspect-[1/1] lg:max-h-[560px]">
            <Image src={p.image} alt="" fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </Parallax>
        </Reveal>
      </section>

      {/* Facts strip */}
      <section className="border-y border-ink/10">
        <div className="page"><dl className={`grid grid-cols-2 gap-px bg-ink/10 [&>div]:bg-white ${facts.length > 3 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {facts.map(([k, v]) => (
            <div key={k} className="px-1 py-7 md:px-8 md:first:pl-0">
              <dt className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">{k}</dt><dd className="mt-2 text-[16px] font-semibold leading-snug">{v}</dd>
            </div>
          ))}
        </dl></div>
      </section>

      {/* Highlights */}
      <section className="page py-16 md:py-20">
        <Reveal><h2 className="max-w-[18ch] text-[clamp(2rem,1.4rem+2.2vw,3.5rem)] font-semibold leading-[1.03] tracking-[-0.04em]">What makes it different.</h2></Reveal>
        <ul className="mt-8 grid gap-x-12 gap-y-0 md:grid-cols-2 lg:grid-cols-3">
          {p.highlights.map((h, i) => (
            <Reveal key={h} delay={(i % 3) * 0.08}>
              <li className="flex gap-5 border-t border-ink/10 py-7">
                <span className="text-[clamp(2rem,1.6rem+1vw,2.75rem)] font-semibold leading-none tracking-[-0.04em] text-ink/15">{String(i + 1).padStart(2, "0")}</span>
                <span className="pt-1 text-[18px] font-medium leading-snug tracking-[-0.01em]">{h}</span>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Photos */}
      <section className="page pb-16 md:pb-20">
        <Reveal className="mb-8"><h2 className="text-[clamp(1.8rem,1.3rem+1.6vw,2.75rem)] font-semibold tracking-[-0.035em]">{surgeon ? "Inside the OT and on graduation day" : "Inside the clinic"}</h2></Reveal>
        <PhotoWall photos={p.gallery?.length ? p.gallery.map((src, i) => ({ src, alt: `${p.title} photo ${i + 1}`, tall: i % 3 === 1 })) : surgeon ? COLLEGE_PHOTOS.slice(0, 8) : REHAB_PHOTOS} />
      </section>

      {/* Curriculum */}
      <section className="page">
        <div className="rounded-[32px] bg-mist px-5 py-10 sm:px-10 md:rounded-[40px] md:py-14 lg:px-14">
          <Reveal className="mb-10"><h2 className="text-[clamp(2rem,1.4rem+2.2vw,3.5rem)] font-semibold tracking-[-0.04em]">What you&apos;ll learn</h2></Reveal>
          <Reveal delay={0.1}><Curriculum modules={p.curriculum} /></Reveal>
        </div>
      </section>

      {/* Who + outcomes */}
      <section className="page grid gap-6 py-24 md:grid-cols-2 md:py-32">
        {[["Who it's for", p.eligibility, "bg-white border border-ink/10"], ["You'll leave able to", p.outcomes, "bg-navy text-white"]].map(([t, list, cls], i) => (
          <Reveal key={t as string} delay={i * 0.1}>
            <div className={`h-full rounded-[28px] p-8 md:p-12 ${cls}`}>
              <h2 className="text-[clamp(1.6rem,1.2rem+1.2vw,2.25rem)] font-semibold tracking-[-0.03em]">{t as string}</h2>
              <ul className="mt-8 space-y-4">{(list as string[]).map((e) => (
                <li key={e} className="flex gap-4 text-[17px] leading-snug"><svg className={`mt-1 shrink-0 ${i ? "text-teal" : "text-brand"}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M5 12l5 5L19 7" /></svg><span className={i ? "text-white/85" : "text-ink/75"}>{e}</span></li>
              ))}</ul>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Fees */}
      <section className="page pb-16 md:pb-20">
        <Reveal>
          <div className="grid overflow-hidden rounded-[32px] border border-ink/10 lg:grid-cols-[1fr_1.1fr]">
            <div className="p-8 md:p-12">
              <h2 className="text-[clamp(1.8rem,1.3rem+1.6vw,2.75rem)] font-semibold tracking-[-0.035em]">Fees &amp; admission</h2>
              <p className="mt-4 max-w-[40ch] text-ink/60">Apply online. Our coordinator reviews every application within two working days and sends a secure payment link once you&apos;re accepted.</p>
              <ol className="mt-10 space-y-5">
                {["Apply online (3 minutes)", "Call with our coordinator", p.deposit ? `Pay ${p.deposit}% to reserve your seat` : "Pay to confirm your seat", "Join your cohort in Gurugram"].map((s, i) => (
                  <li key={s} className="flex items-center gap-4 text-[16px]"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-mist text-[13px] font-semibold">{i + 1}</span>{s}</li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col justify-between gap-10 bg-ink p-8 text-white md:p-12">
              {p.fee.length ? (
                <ul className="space-y-6">{p.fee.map((f) => (
                  <li key={f.label} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-6">
                    <span className="text-[15px] text-white/60">{f.label}</span>
                    <span className="text-[clamp(2rem,1.5rem+1.6vw,3rem)] font-semibold tracking-[-0.04em]">{inr(f.amount)}<span className="ml-2 text-[14px] font-normal tracking-normal text-white/50">{f.note}</span></span>
                  </li>
                ))}</ul>
              ) : <p className="text-[22px] font-medium leading-snug">Fees are shared by our coordinator after you apply.</p>}
              <div>
                {p.deposit && <p className="mb-6 text-[14px] text-white/55">{p.deposit}% at booking, balance on joining. Seats are limited every month.</p>}
                <Link href={apply} className="flex h-14 w-full items-center justify-center rounded-full bg-teal text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5">Apply for this programme</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Films */}
      <section className="page py-6">
        <div className="rounded-[32px] bg-ink px-5 py-10 text-white sm:px-10 md:rounded-[40px] md:py-14 lg:px-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <Reveal><h2 className="text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold tracking-[-0.035em]">See it before you join</h2></Reveal>
            <Link href="/videos" className="text-[15px] font-semibold text-teal hover:underline">All films →</Link>
          </div>
          <FilmTheatre films={films} />
        </div>
      </section>

      {/* FAQ */}
      {p.slug === "fellowship-in-arthroscopy" && (
        <section className="page grid gap-12 py-24 md:grid-cols-12 md:py-32">
          <Reveal className="md:col-span-4"><h2 className="text-[clamp(2rem,1.4rem+2vw,3.25rem)] font-semibold tracking-[-0.035em]">Questions</h2></Reveal>
          <div className="divide-y divide-ink/10 border-y border-ink/10 md:col-span-7 md:col-start-6">
            {FAQS.map((f, i) => (
              <details key={f.q} id={`faq-${i}`} className="group scroll-mt-28 py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[18px] font-medium [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border border-ink/15 transition-transform duration-300 group-open:rotate-45">+</span></summary>
                <p className="mt-4 max-w-[62ch] leading-relaxed text-ink/65">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Other programmes */}
      <section className="py-14 md:py-20">
        <div className="page">
          <h2 className="text-[clamp(1.6rem,1.2rem+1.2vw,2.25rem)] font-semibold tracking-[-0.03em]">Other programmes</h2>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/programs/${o.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-mist"><Image src={o.image} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" /></div>
                  <p className="mt-5 text-[19px] font-semibold tracking-[-0.02em] group-hover:text-brand">{o.title}</p>
                  <p className="mt-1 text-[14px] text-ink/55">{o.duration} · {o.format}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Mobile apply bar */}
      <div className="sticky bottom-0 z-30 flex items-center gap-3 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{p.title}</p><p className="text-[13px] text-ink/55">{p.fee[0] ? `From ${inr(p.fee[0].amount)}` : p.duration}</p></div>
        <Link href={apply} className="inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-semibold text-white">Apply</Link>
      </div>
    </div>
  );
}

export default function Program({ params }: P) {
  return <Suspense fallback={<div className="page min-h-[80vh]" aria-busy />}><ProgramBody params={params} /></Suspense>;
}
