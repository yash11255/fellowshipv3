import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROGRAMS, getProgram, inr, FAQS } from "@/lib/programs";
import { getSeo } from "@/lib/settings";

type P = PageProps<"/programs/[slug]">;
export function generateStaticParams() { return PROGRAMS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = getProgram((await params).slug);
  return p ? { title: p.title, description: p.short, alternates: { canonical: `/programs/${p.slug}` }, openGraph: { images: [p.image] } } : {};
}

export default async function Program({ params }: P) {
  const p = getProgram((await params).slug);
  if (!p) notFound();
  const { siteUrl } = await getSeo();
  const ld = {
    "@context": "https://schema.org", "@type": "Course", name: p.title, description: p.short,
    provider: { "@type": "Organization", name: "Arthroscopy College", sameAs: siteUrl },
    ...(p.fee[0] ? { offers: { "@type": "Offer", price: p.fee[0].amount, priceCurrency: "INR", category: "Paid" } } : {}),
    hasCourseInstance: { "@type": "CourseInstance", courseMode: p.format.startsWith("Online") ? "online" : "onsite", location: "Gurugram, Haryana, India", courseWorkload: p.duration },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <Image src={p.image} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-navy/75" />
        <div className="page py-16 md:py-24">
          <nav className="text-[13px] text-white/70"><Link href="/programs" className="hover:text-white">Programs</Link> / {p.title}</nav>
          <h1 className="mt-5 max-w-[22ch] text-[clamp(2.2rem,1.4rem+3vw,4rem)] font-semibold leading-[1] tracking-[-0.04em]">{p.title}</h1>
          <p className="mt-5 max-w-[56ch] text-[17px] text-white/80">{p.short}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 text-[14px]">
            {[["Duration", p.duration], ["Format", p.format], ["For", p.audience], ...(p.schedule ? [["Schedule", p.schedule]] : [])].map(([k, v]) => <div key={k}><dt className="text-white/60">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
          </dl>
        </div>
      </section>

      <div className="page grid gap-12 pt-14 lg:grid-cols-12">
        <div className="space-y-14 lg:col-span-7">
          <section>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">Highlights</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">{p.highlights.map((h) => <li key={h} className="flex gap-3 border border-line p-4 text-[15px]"><span aria-hidden className="text-navy">✓</span>{h}</li>)}</ul>
          </section>
          <section>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em]">What you&apos;ll learn</h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              {p.curriculum.map((c) => (
                <div key={c.title} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]"><p className="font-semibold">{c.title}</p><ul className="space-y-1.5 text-[15px] text-[#3d3d3d]">{c.items.map((i) => <li key={i}>{i}</li>)}</ul></div>
              ))}
            </div>
          </section>
          <section className="grid gap-8 sm:grid-cols-2">
            <div><h2 className="text-[20px] font-semibold">Who should apply</h2><ul className="mt-3 space-y-2 text-[15px] text-[#3d3d3d]">{p.eligibility.map((e) => <li key={e}>· {e}</li>)}</ul></div>
            <div><h2 className="text-[20px] font-semibold">Outcomes</h2><ul className="mt-3 space-y-2 text-[15px] text-[#3d3d3d]">{p.outcomes.map((e) => <li key={e}>· {e}</li>)}</ul></div>
          </section>
          {p.slug === "fellowship-in-arthroscopy" && (
            <section><h2 className="text-[26px] font-semibold tracking-[-0.02em]">FAQ</h2>
              <div className="mt-5 divide-y divide-line border-y border-line">{FAQS.map((f) => <details key={f.q} className="py-4"><summary className="cursor-pointer font-semibold">{f.q}</summary><p className="body mt-2">{f.a}</p></details>)}</div>
            </section>
          )}
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-navy p-6 lg:sticky lg:top-28">
            <p className="label text-brand">Fees</p>
            {p.fee.length ? (
              <ul className="mt-3 divide-y divide-line">{p.fee.map((f) => <li key={f.label} className="flex items-baseline justify-between py-3"><span className="text-[15px]">{f.label}</span><span className="text-[22px] font-semibold tracking-[-0.02em]">{inr(f.amount)} <span className="text-[13px] font-normal text-grey">{f.note}</span></span></li>)}</ul>
            ) : <p className="mt-3 text-[15px]">Fee shared by our coordinator after your application.</p>}
            {p.deposit && <p className="small mt-2">{p.deposit}% at booking, the balance on joining.</p>}
            <Link href={`/apply?program=${p.slug}`} className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-navy text-[14px] font-semibold text-white hover:bg-black">Apply for this program</Link>
            <a href="https://wa.me/919650620870?text=Hi%2C%20I%27d%20like%20to%20know%20more%20about%20the%20program" target="_blank" rel="noopener noreferrer" className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-line text-[14px] font-semibold hover:border-black">Ask on WhatsApp</a>
            <p className="small mt-4">Applications are reviewed within 2 working days. Seats are limited each month.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
