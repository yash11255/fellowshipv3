import type { Metadata } from "next";
import { Suspense } from "react";
import { search } from "@/lib/search";
import { buildSearchIndex } from "@/lib/search-index";
import { ResultRow } from "@/components/search/search-overlay";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const hits = search(await buildSearchIndex(), q, 40);
  return (
    <>
      <h1 className="text-[clamp(2rem,1.4rem+2vw,3rem)] font-semibold tracking-[-0.035em]">{q ? <>Results for “{q}”</> : "Search"}</h1>
      <form className="mt-6 flex max-w-xl gap-2"><input name="q" defaultValue={q} placeholder="Search programmes, fees, articles" className="h-12 flex-1 rounded-full border border-ink/15 px-5 text-[15px] outline-none focus:border-ink" /><button className="h-12 rounded-full bg-ink px-6 text-[14px] font-semibold text-white">Search</button></form>
      <p className="mt-6 text-[14px] text-ink/50">{hits.length} result{hits.length === 1 ? "" : "s"}</p>
      <ul className="mt-2 grid gap-1 md:grid-cols-2">{hits.map((r, i) => <li key={r.href + i}><ResultRow r={r} /></li>)}</ul>
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return <div className="page py-10 md:py-16"><Suspense fallback={<div className="min-h-[50vh]" />}><Results searchParams={searchParams} /></Suspense></div>;
}
