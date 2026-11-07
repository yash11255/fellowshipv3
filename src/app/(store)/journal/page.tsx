import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticles } from "@/lib/content";
import { Reveal } from "@/components/college/reveal";

export const metadata: Metadata = { title: "Blog", description: "Articles on arthroscopy, ACL surgery, shoulder surgery, rehabilitation and fellowship training from Dr. Manu Bora and Arthroscopy College.", alternates: { canonical: "/journal" } };
const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function Journal() {
  const items = await getArticles();
  const [lead, ...rest] = items;
  return (
    <div className="page py-10 text-ink md:py-16">
      <Reveal>
        <h1 className="text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)] font-semibold leading-[0.97] tracking-[-0.045em]">Blog</h1>
        <p className="mt-4 max-w-[56ch] text-[18px] text-ink/65">Techniques, recovery and training: notes from Dr. Manu Bora and the Arthroscopy College team.</p>
      </Reveal>
      {lead && (
        <Reveal delay={0.1}>
          <Link href={`/journal/${lead.slug}`} className="group mt-10 grid overflow-hidden rounded-[32px] bg-mist md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[360px]">{lead.image && <Image src={lead.image} alt="" fill sizes="(min-width:768px) 50vw, 100vw" priority className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}</div>
            <div className="flex flex-col justify-center p-7 md:p-12">
              <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-brand">Latest · {date(lead.publishedAt)}</p>
              <h2 className="mt-3 text-[clamp(1.6rem,1.2rem+1.4vw,2.5rem)] font-semibold leading-tight tracking-[-0.03em] group-hover:text-brand">{lead.title}</h2>
              <p className="mt-4 line-clamp-3 text-ink/65">{lead.excerpt}</p>
            </div>
          </Link>
        </Reveal>
      )}
      <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {rest.map((a, i) => (
          <li key={a.slug}>
            <Reveal delay={(i % 3) * 0.05}>
              <Link href={`/journal/${a.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-mist">{a.image && <Image src={a.image} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}</div>
                <p className="mt-4 text-[13px] text-ink/50">{date(a.publishedAt)}</p>
                <h3 className="mt-1 text-[18px] font-semibold leading-snug tracking-[-0.01em] group-hover:text-brand">{a.title}</h3>
                <p className="mt-2 line-clamp-2 text-[14px] text-ink/60">{a.excerpt}</p>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
