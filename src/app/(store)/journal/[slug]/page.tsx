import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/content";
import { getSeo } from "@/lib/settings";
import { Prose } from "@/components/content/prose";

type P = PageProps<"/journal/[slug]">;

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt.slice(0, 160),
    alternates: { canonical: `/journal/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt.slice(0, 160), images: a.image ? [a.image] : [], publishedTime: a.publishedAt.toISOString(), authors: [a.author] },
  };
}

async function Article({ params }: { params: P["params"] }) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();
  const { siteUrl } = await getSeo();
  const more = (await getArticles(4)).filter((x) => x.slug !== slug).slice(0, 3);
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, image: a.image ? [`${siteUrl}${a.image}`] : undefined, datePublished: a.publishedAt.toISOString(), dateModified: a.updatedAt.toISOString(), author: { "@type": "Person", name: a.author }, publisher: { "@type": "Organization", name: "Reverse Clinics" }, mainEntityOfPage: `${siteUrl}/journal/${a.slug}` };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="page pt-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="small"><Link href="/" className="hover:underline">Home</Link> / <Link href="/journal" className="hover:underline">Journal</Link></nav>
        <header className="mx-auto mt-8 max-w-3xl text-center">
          <p className="label text-grey">{a.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {a.author}</p>
          <h1 className="mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{a.title}</h1>
        </header>
        {a.image && <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden bg-tile"><Image src={a.image} alt="" fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" /></div>}
        <Prose html={a.body} className="mx-auto mt-12" />
        <aside className="mx-auto mt-14 max-w-[72ch] border-y border-line py-6 text-[14px]">
          <p className="font-semibold">Not sure what fits you?</p>
          <p className="small mt-1">Take the 60-second quiz for a personalised stack, or book a consultation with our clinic. This article is for information and isn&apos;t medical advice.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Link href="/stack-builder" className="inline-flex h-10 items-center bg-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Find your stack</Link><Link href="/clinic" className="inline-flex h-10 items-center border border-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em]">Book a consultation</Link></div>
        </aside>
      </article>
      {more.length > 0 && (
        <section className="page pt-20">
          <h2 className="hd-2">Keep reading</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {more.map((m) => (
              <li key={m.slug}><Link href={`/journal/${m.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-tile">{m.image && <Image src={m.image} alt="" fill sizes="33vw" className="object-cover" />}</div>
                <p className="mt-3 text-[16px] font-semibold leading-snug group-hover:underline">{m.title}</p>
              </Link></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function Page({ params }: P) {
  return <Suspense fallback={<div className="page min-h-[60vh]" />}><Article params={params} /></Suspense>;
}
