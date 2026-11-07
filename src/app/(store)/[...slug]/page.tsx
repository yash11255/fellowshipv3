import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPage, getPagesUnder } from "@/lib/content";
import { Prose } from "@/components/content/prose";
import { EnquiryForm } from "@/components/content/enquiry-form";

type P = PageProps<"/[...slug]">;
const slugOf = async (params: P["params"]) => (await params).slug.join("/");

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const slug = await slugOf(params);
  const p = await getPage(slug);
  if (!p) return {};
  return { title: p.seoTitle || p.title, description: p.seoDescription ?? undefined, alternates: { canonical: `/${slug}` } };
}

async function ContentPage({ params }: { params: P["params"] }) {
  const slug = await slugOf(params);
  const page = await getPage(slug);
  if (!page) notFound();
  const isClinic = slug === "clinic" || slug.startsWith("clinic/");
  const services = isClinic ? await getPagesUnder("clinic") : [];
  const options = services.map((s) => ({ value: s.slug, label: s.title }));
  const crumbs = slug.split("/");

  return (
    <div className="page pt-8 md:pt-12">
      <nav aria-label="Breadcrumb" className="small">
        <Link href="/" className="hover:underline">Home</Link>
        {crumbs.length > 1 && <> / <Link href={`/${crumbs[0]}`} className="capitalize hover:underline">{crumbs[0]}</Link></>}
        {" / "}<span className="text-black">{page.title}</span>
      </nav>
      <div className="mt-6 grid gap-12 lg:grid-cols-12">
        <article className={isClinic || slug === "contact" ? "lg:col-span-7" : "lg:col-span-8"}>
          <h1 className="hd-1">{page.title}</h1>
          <Prose html={page.body} className="mt-8" />
          {slug === "clinic" && services.length > 0 && (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s.slug}><Link href={`/${s.slug}`} className="group flex items-center justify-between border border-line p-4 text-[15px] font-semibold hover:border-black">{s.title}<span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span></Link></li>
              ))}
            </ul>
          )}
        </article>
        {(isClinic || slug === "contact") && (
          <aside className="lg:col-span-5">
            <div className="border border-black p-6 lg:sticky lg:top-32">
              <h2 className="hd-3">{isClinic ? "Book a consultation" : "Write to us"}</h2>
              <p className="small mb-6 mt-1">{isClinic ? "Share a few details and the clinic will call to confirm a time." : "Questions about an order or a product? We reply within one working day."}</p>
              <EnquiryForm kind={isClinic ? "clinic" : "contact"} services={options} defaultService={services.find((s) => s.slug === slug)?.title} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function Page({ params }: P) {
  return <Suspense fallback={<div className="page min-h-[60vh]" />}><ContentPage params={params} /></Suspense>;
}
