import Image from "next/image";
import Link from "next/link";
import { FAQS } from "@/lib/programs";
import { FEATURED_VIDEOS } from "@/lib/videos";
import { LiteYouTube } from "@/components/video/lite-youtube";

/* Apple-style homepage: centred headlines, few words, big rounded imagery, grey tiles, text links. */

function Links({ primary, secondary, dark }: { primary: [string, string]; secondary?: [string, string]; dark?: boolean }) {
  const cls = dark ? "text-[#2997ff]" : "text-[#0066cc]";
  return (
    <p className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[17px]">
      <Link href={primary[1]} className={`${cls} hover:underline`}>{primary[0]} ›</Link>
      {secondary && <Link href={secondary[1]} className={`${cls} hover:underline`}>{secondary[0]} ›</Link>}
    </p>
  );
}

function Tile({ title, sub, href, apply, image, dark, priority }: { title: string; sub: string; href: string; apply: string; image: string; dark?: boolean; priority?: boolean }) {
  return (
    <section className={`relative flex min-h-[580px] flex-col overflow-hidden rounded-[22px] text-center md:min-h-[640px] ${dark ? "bg-black text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"}`}>
      <div className="relative z-10 px-6 pt-12">
        <h2 className="text-[clamp(1.9rem,1.4rem+1.6vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.025em]">{title}</h2>
        <p className={`mx-auto mt-2 max-w-[30ch] text-[clamp(1.05rem,0.95rem+0.4vw,1.3rem)] ${dark ? "text-white/80" : "text-[#1d1d1f]"}`}>{sub}</p>
        <Links primary={["Learn more", href]} secondary={["Apply", apply]} dark={dark} />
      </div>
      <div className="relative mt-auto h-[58%] min-h-[300px]">
        <Image src={image} alt="" fill priority={priority} sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="bg-white text-[#1d1d1f]">
      {/* Hero */}
      <section className="pt-14 text-center md:pt-20">
        <div className="page">
          <p className="text-[clamp(1.1rem,1rem+0.5vw,1.5rem)] font-semibold text-[#6e6e73]">Arthroscopy College</p>
          <h1 className="mx-auto mt-2 max-w-[16ch] text-[clamp(2.75rem,1.6rem+5vw,6rem)] font-semibold leading-[1.02] tracking-[-0.04em]">Learn arthroscopy in the OT.</h1>
          <p className="mx-auto mt-5 max-w-[34ch] text-[clamp(1.15rem,1rem+0.6vw,1.6rem)] leading-snug">A one-month fellowship with Dr. Manu Bora. 30–40 surgeries. Hands-on.</p>
          <Links primary={["Apply for fellowship", "/apply?program=fellowship-in-arthroscopy"]} secondary={["Learn more", "/programs/fellowship-in-arthroscopy"]} />
        </div>
        <div className="mx-auto mt-12 max-w-[1440px] px-4 md:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] md:aspect-[2.18/1]">
            <Image src="/img/ot-1.webp" alt="Fellows operating with Dr. Manu Bora" fill priority sizes="100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="page py-24 text-center md:py-36">
        <p className="mx-auto max-w-[22ch] text-[clamp(2rem,1.3rem+3vw,4rem)] font-semibold leading-[1.08] tracking-[-0.035em]">
          India&apos;s highest number of ACL internal-brace surgeries. <span className="text-[#86868b]">Now you can learn how they&apos;re done.</span>
        </p>
      </section>

      {/* Program tiles */}
      <div className="mx-auto grid max-w-[1440px] gap-3 px-3 md:grid-cols-2 md:px-6">
        <Tile title="Fellowship in Arthroscopy" sub="Knee, shoulder, ankle. One month in the OT." href="/programs/fellowship-in-arthroscopy" apply="/apply?program=fellowship-in-arthroscopy" image="/img/ot-2.webp" dark priority />
        <Tile title="Next-Gen ACL Course" sub="Quad tendon. Internal brace. LET. Five days." href="/programs/advance-acl-course" apply="/apply?program=advance-acl-course" image="/img/ot-1.webp" />
        <Tile title="Physiotherapy Internship" sub="ACL rehab, pre-op to return-to-sport." href="/programs/physiotherapy-internship" apply="/apply?program=physiotherapy-internship" image="/img/faculty-viraj.jpg" />
        <Tile title="ACL Rehab Workshop" sub="Two days for physiotherapists." href="/programs/acl-rehab-workshop" apply="/apply?program=acl-rehab-workshop" image="/img/alumni-8.jpg" />
      </div>

      {/* Numbers */}
      <section className="page py-24 md:py-32">
        <div className="grid gap-12 text-center md:grid-cols-3">
          {[["30–40", "surgeries a month"], ["1 month", "extendable fellowship"], ["Arthrex", "certificate"]].map(([n, l]) => (
            <div key={l}><p className="text-[clamp(3rem,2rem+3vw,4.5rem)] font-semibold leading-none tracking-[-0.04em]">{n}</p><p className="mt-3 text-[19px] text-[#6e6e73]">{l}</p></div>
          ))}
        </div>
      </section>

      {/* Doctor */}
      <section className="bg-[#f5f5f7] py-24 md:py-32">
        <div className="page text-center">
          <h2 className="text-[clamp(2.2rem,1.4rem+3vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Dr. Manu Bora.</h2>
          <p className="mx-auto mt-4 max-w-[40ch] text-[clamp(1.1rem,1rem+0.5vw,1.45rem)] leading-snug text-[#1d1d1f]">Master Instructor, Arthrex. All-inside ACL &amp; PCL reconstruction with FiberTape internal brace.</p>
          <Links primary={["Read his story", "/dr-manu-bora"]} />
          <div className="relative mx-auto mt-12 aspect-[4/5] max-w-[440px] overflow-hidden rounded-[22px] bg-white">
            <Image src="/brand/dr-manu-bora.jpg" alt="Dr. Manu Bora" fill sizes="440px" className="object-cover object-top" />
          </div>
        </div>
      </section>

      {/* Videos */}
      <section className="py-24 md:py-32">
        <div className="page flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[clamp(2rem,1.4rem+2vw,3rem)] font-semibold tracking-[-0.03em]">Watch the fellowship.</h2>
          <Link href="/videos" className="text-[17px] text-[#0066cc] hover:underline">All videos ›</Link>
        </div>
        <ul className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:none] md:scroll-px-8 md:px-8 xl:scroll-px-[calc((100vw-96rem)/2+3rem)] xl:px-[calc((100vw-96rem)/2+3rem)] [&::-webkit-scrollbar]:hidden">
          {FEATURED_VIDEOS.map((v) => (
            <li key={v.id} className="w-[82vw] shrink-0 snap-start sm:w-[460px]">
              <LiteYouTube id={v.id} title={v.title} />
              <p className="mt-4 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{v.title}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Alumni */}
      <section className="page">
        <h2 className="text-center text-[clamp(2rem,1.4rem+2vw,3rem)] font-semibold tracking-[-0.03em]">Our fellows.</h2>
        <p className="mt-2 text-center text-[19px] text-[#6e6e73]">Certified, every month.</p>
        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <li key={i} className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-[#f5f5f7]"><Image src={`/img/alumni-${i}.jpg`} alt="Fellow receiving a certificate from Dr. Manu Bora" fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" /></li>
          ))}
        </ul>
        <p className="mt-6 text-center"><Link href="/gallery" className="text-[17px] text-[#0066cc] hover:underline">View gallery ›</Link></p>
      </section>

      {/* FAQ */}
      <section className="page py-24 md:py-32">
        <h2 className="text-center text-[clamp(2rem,1.4rem+2vw,3rem)] font-semibold tracking-[-0.03em]">Questions.</h2>
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-[#d2d2d7] border-y border-[#d2d2d7]">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[19px] font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">{f.q}<span aria-hidden className="text-[24px] font-light text-[#6e6e73] transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-3 text-[17px] leading-relaxed text-[#424245]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="bg-[#f5f5f7] py-24 text-center md:py-32">
        <div className="page">
          <h2 className="mx-auto max-w-[18ch] text-[clamp(2.2rem,1.4rem+3vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">Limited seats. Every month.</h2>
          <p className="mt-4 text-[19px] text-[#6e6e73]">Apply in three minutes. We call you within two working days.</p>
          <Link href="/apply" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#0071e3] px-7 text-[17px] text-white hover:bg-[#0077ed]">Apply now</Link>
        </div>
      </section>
    </div>
  );
}
