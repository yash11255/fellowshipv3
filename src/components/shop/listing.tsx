import Link from "next/link";
import clsx from "clsx";
import { ProductCard } from "@/components/product-card";
import { GOAL_LABELS, type Goal, type Product } from "@/lib/catalog";

export const FILTERS: { slug: string; label: string }[] = [
  { slug: "", label: "All" },
  { slug: "packs", label: "Packs" },
  ...(["longevity", "energy", "joints-bones", "skin-hair-nails", "sport", "metabolic", "heart", "gut", "sleep-stress", "brain", "immunity", "weight"] as Goal[])
    .map((g) => ({ slug: g, label: GOAL_LABELS[g] })),
];

export function Listing({ title, intro, products, active }: { title: string; intro?: string; products: Product[]; active: string }) {
  // in-stock first, then packs, then price
  const sorted = [...products].sort((a, b) => Number(b.available) - Number(a.available));

  return (
    <div className="page pt-8 md:pt-12">
      <nav aria-label="Breadcrumb" className="small"><Link href="/" className="hover:underline">Home</Link> / <span className="text-black">{title}</span></nav>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="hd-1">{title}</h1>
          {intro && <p className="body mt-3 max-w-[60ch]">{intro}</p>}
        </div>
        <p className="small">{products.length} products</p>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mt-8 border-y border-line bg-white px-4 md:-mx-8 md:px-8 lg:top-[108px] xl:-mx-12 xl:px-12">
        <ul className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <li key={f.slug} className="shrink-0">
              <Link href={f.slug ? `/shop/${f.slug}` : "/shop"} aria-current={active === f.slug ? "page" : undefined}
                className={clsx("inline-flex h-9 items-center border px-4 text-[13px] font-medium transition-colors",
                  active === f.slug ? "border-black bg-black text-white" : "border-line hover:border-black")}>
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {sorted.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-4 xl:grid-cols-4">
          {sorted.map((p, i) => <ProductCard key={p.handle} product={p} priority={i < 4} />)}
        </div>
      ) : (
        <p className="body py-24 text-center">No products here yet.</p>
      )}
    </div>
  );
}
