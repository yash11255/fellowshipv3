import type { Metadata } from "next";
import { Suspense } from "react";
import { getProducts, GOAL_LABELS } from "@/lib/catalog";
import { norm, search, type SearchItem } from "@/lib/search";
import { ProductCard } from "@/components/product-card";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const ps = (await getProducts()).filter((p) => p.kind !== "gift");
  const idx: SearchItem[] = ps.map((p) => ({ handle: p.handle, title: p.title, price: p.variants[0]?.price ?? 0, compareAt: 0, kind: p.kind, goals: (p.goals ?? []).map((g) => GOAL_LABELS[g]), actives: (p.keyActives ?? []).map((a) => a.name), available: p.available, text: norm(`${p.description} ${(p.goals ?? []).join(" ")}`) }));
  const hits = search(idx, q, 40).map((h) => ps.find((p) => p.handle === h.handle)!).filter(Boolean);
  return (
    <>
      <h1 className="hd-1">{q ? <>Results for “{q}”</> : "Search"}</h1>
      <p className="small mt-2">{hits.length} product{hits.length === 1 ? "" : "s"}</p>
      <form className="mt-6 flex max-w-xl"><input name="q" defaultValue={q} placeholder="Search products, ingredients or concerns" className="h-12 flex-1 border border-black px-4 text-[15px] outline-none" /><button className="h-12 bg-black px-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Search</button></form>
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 xl:grid-cols-4">{hits.map((p) => <ProductCard key={p.handle} product={p} />)}</div>
    </>
  );
}

export default function Page({ searchParams }: PageProps<"/search">) {
  return <div className="page pt-10"><Suspense fallback={<div className="min-h-[50vh]" />}><Results searchParams={searchParams} /></Suspense></div>;
}
