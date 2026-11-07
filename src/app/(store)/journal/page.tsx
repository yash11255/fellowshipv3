import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticles } from "@/lib/content";

export const metadata: Metadata = { title: "Journal", description: "Notes on longevity, nutrition, recovery and healthy ageing from Dr. Manu Bora and the Reverse Clinics team.", alternates: { canonical: "/journal" } };
const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function Journal() {
  const items = await getArticles();
  const [lead, ...rest] = items;
  return (
    <div className="page pt-8 md:pt-12">
      <h1 className="hd-1">Journal</h1>
      <p className="body mt-2 max-w-[60ch]">Evidence-led notes on longevity, nutrition, recovery and healthy ageing.</p>
      {lead && (
        <Link href={`/journal/${lead.slug}`} className="group mt-10 grid gap-6 border-b border-line pb-12 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[16/10] overflow-hidden bg-tile">{lead.image && <Image src={lead.image} alt="" fill sizes="(min-width:768px) 50vw, 100vw" priority className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}</div>
          <div>
            <p className="label text-grey">Latest · {date(lead.publishedAt)}</p>
            <h2 className="hd-2 mt-3 group-hover:underline">{lead.title}</h2>
            <p className="body mt-3 line-clamp-3">{lead.excerpt}</p>
          </div>
        </Link>
      )}
      <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((a) => (
          <li key={a.slug}>
            <Link href={`/journal/${a.slug}`} className="group block">
              <div className="relative aspect-[16/10] overflow-hidden bg-tile">{a.image && <Image src={a.image} alt="" fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />}</div>
              <p className="small mt-4">{date(a.publishedAt)}</p>
              <h3 className="mt-1 text-[17px] font-semibold leading-snug group-hover:underline">{a.title}</h3>
              <p className="small mt-2 line-clamp-2">{a.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
