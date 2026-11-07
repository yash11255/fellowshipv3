import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { getArticle, getPage } from "@/lib/content";
import { Prose } from "@/components/content/prose";

type P = PageProps<"/[...slug]">;
const slugOf = async (params: P["params"]) => (await params).slug.join("/");

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = await slugOf(params);
  const p = await getPage(slug);
  if (!p) return {};
  return { title: p.seoTitle || p.title, description: p.seoDescription ?? undefined, alternates: { canonical: `/${slug}` } };
}

/** CMS pages (legal pages and anything created in Admin → Content). Old WordPress post URLs (/post-slug) redirect to /journal/post-slug. */
async function ContentPage({ params }: { params: P["params"] }) {
  const slug = await slugOf(params);
  const page = await getPage(slug);
  if (!page) {
    if (!slug.includes("/") && (await getArticle(slug))) permanentRedirect(`/journal/${slug}`);
    notFound();
  }
  return (
    <div className="page max-w-4xl py-10 md:py-16">
      <h1 className="text-[clamp(2.2rem,1.4rem+2.6vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em]">{page.title}</h1>
      <p className="mt-4 text-[14px] text-ink/50">Last updated {page.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      <Prose html={page.body} className="mt-10" />
    </div>
  );
}

export default function Page({ params }: P) {
  return <Suspense fallback={<div className="page min-h-[60vh]" />}><ContentPage params={params} /></Suspense>;
}
