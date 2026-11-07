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
    keywords: [a.focusKeyword, ...a.tags].filter((x): x is string => !!x),
    authors: [{ name: a.author }],
    openGraph: { type: "article", title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt.slice(0, 160), images: a.image ? [{ url: a.image, alt: a.title }] : [], publishedTime: a.publishedAt.toISOString(), modifiedTime: a.updatedAt.toISOString(), authors: [a.author], tags: a.tags },
    twitter: { card: "summary_large_image", title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt.slice(0, 160), images: a.image ? [a.image] : [] },
  };
}

async function Article({ params }: { params: P["params"] }) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();
  const { siteUrl } = await getSeo();
  const more = (await getArticles(4)).filter((x) => x.slug !== slug).slice(0, 3);
  const ld = { "@context": "https://schema.org", "@type": "Article", headline: a.title, image: a.image ? [`${siteUrl}${a.image}`] : undefined, datePublished: a.publishedAt.toISOString(), dateModified: a.updatedAt.toISOString(), author: { "@type": "Person", name: a.author }, publisher: { "@type": "Organization", name: "Arthroscopy College", logo: { "@type": "ImageObject", url: `${siteUrl}/brand/logo.jpg` } }, keywords: [a.focusKeyword, ...a.tags].filter(Boolean).join(", ") || undefined, wordCount: a.body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length, mainEntityOfPage: `${siteUrl}/journal/${a.slug}` };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="page pt-8 md:pt-12">
        <nav aria-label="Breadcrumb" className="small"><Link href="/" className="hover:underline">Home</Link> / <Link href="/journal" className="hover:underline">Blog</Link></nav>
        <header className="mx-auto mt-8 max-w-3xl text-center">
          <p className="label text-grey">{a.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · {a.author}</p>
          <h1 className="mt-4 text-[clamp(2rem,1.4rem+2.6vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em]">{a.title}</h1>
        </header>
        {a.image && <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden bg-tile"><Image src={a.image} alt="" fill priority sizes="(min-width:1024px) 1024px, 100vw" className="object-cover" /></div>}
        <Prose html={a.body} className="mx-auto mt-12" />
        <aside className="mx-auto mt-14 max-w-[72ch] rounded-[28px] bg-navy p-8 text-white">
          <p className="text-[20px] font-semibold tracking-[-0.02em]">Learn it in the operating theatre</p>
          <p className="mt-2 text-[15px] text-white/70">Train hands-on with Dr. Manu Bora: 30–40 surgeries a month and an Arthrex certificate. This article is for education and isn&apos;t medical advice.</p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/programs/fellowship-in-arthroscopy" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-ink">Explore the fellowship</Link><Link href="/apply" className="inline-flex h-11 items-center rounded-full border border-white/30 px-5 text-[14px] font-semibold">Apply</Link></div>
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
