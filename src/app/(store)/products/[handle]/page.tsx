import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/pdp/gallery";
import { BuyBox } from "@/components/pdp/buy-box";
import { ProductCard } from "@/components/product-card";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { Stars } from "@/components/reviews/stars";
import { getReviews } from "@/lib/reviews";
import { PincodeCheck } from "@/components/pdp/pincode-check";
import { GOAL_LABELS, formatINR, getProduct, getProducts } from "@/lib/catalog";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) return {};
  const description = p.seoDescription || p.description.slice(0, 158);
  return {
    title: p.seoTitle || p.title,
    description,
    alternates: { canonical: `/products/${p.handle}` },
    openGraph: { type: "website", title: p.seoTitle || p.title, description, images: p.images[0] ? [p.images[0]] : [] },
    robots: p.available ? undefined : { index: true, follow: true },
  };
}

const PROMISES = [
  ["GMP certified", "M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"],
  ["Lab tested", "M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"],
  ["Free shipping ₹999+", "M3 7h11v9H3zM14 10h4l3 3v3h-7"],
  ["Easy returns", "M4 12a8 8 0 1 0 3-6.2M4 4v4h4"],
] as const;

function Section({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span className="text-[20px] font-light transition-transform group-open:rotate-45" aria-hidden>+</span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return (
    <Suspense fallback={<div className="page min-h-[80vh] pt-6" aria-busy />}>
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: { params: PageProps<"/products/[handle]">["params"] }) {
  const { handle } = await params;
  const p = await getProduct(handle);
  if (!p) notFound();

  const all = await getProducts();
  const parts = (p.includes ?? []).map((h) => all.find((x) => x.handle === h)).filter((x) => !!x);
  const related = all
    .filter((x) => x.handle !== p.handle && x.kind !== "gift" && x.available && x.goals?.some((g) => p.goals?.includes(g)))
    .slice(0, 4);
  const v = p.variants[0];
  const rv = await getReviews(p.handle);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    image: p.images.slice(0, 3).map((i) => `https://reverseclinics.com${i}`),
    description: p.description,
    brand: { "@type": "Brand", name: "Reverse Clinics" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...p.variants.map((x) => x.price)),
      highPrice: Math.max(...p.variants.map((x) => x.price)),
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(rv.count ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rv.avg, reviewCount: rv.count } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [["Home", "/"], ["Shop", "/shop"], [p.title, `/products/${p.handle}`]].map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `https://reverseclinics.com${path}` })),
      }) }} />
      <div className="page pt-6">
        <nav aria-label="Breadcrumb" className="small">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link> / <span className="text-black">{p.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-10 xl:gap-16">
          <div className="md:col-span-7"><Gallery images={p.images} title={p.title} /></div>

          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              {p.goals && <p className="label text-grey">{p.goals.slice(0, 3).map((g) => GOAL_LABELS[g]).join(" · ")}</p>}
              <h1 className="hd-2 mt-3">{p.title}</h1>
              {rv.count > 0 && <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-[13px] hover:underline"><Stars value={rv.avg} /> {rv.avg.toFixed(1)} · {rv.count} review{rv.count > 1 ? "s" : ""}</a>}
              {p.keyActives && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {p.keyActives.map((a) => (
                    <li key={a.name} className="border border-line px-2.5 py-1 text-[13px]"><span className="font-semibold">{a.mg}mg</span> {a.name}</li>
                  ))}
                </ul>
              )}
              {p.kind === "pack" && parts.length > 0 && (
                <p className="body mt-4">Includes {parts.map((x) => x.title).join(", ")}.</p>
              )}

              <div className="mt-7">
                <BuyBox handle={p.handle} title={p.title} image={p.images[0]} variants={p.variants} available={p.available} />
              </div>

              <PincodeCheck />
              <ul className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-6">
                {PROMISES.map(([t, d]) => (
                  <li key={t} className="flex items-center gap-2 text-[13px]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><path d={d} /></svg>{t}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-line">
                <Section title="Description" open><p className="body">{p.description}</p></Section>
                {p.keyActives && (
                  <Section title="Key ingredients">
                    <table className="w-full text-[14px]">
                      <tbody>
                        {p.keyActives.map((a) => (
                          <tr key={a.name} className="border-b border-line last:border-0"><td className="py-2.5">{a.name}</td><td className="py-2.5 text-right font-semibold">{a.mg} mg</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="small mt-3">Full supplement facts are shown in the product images.</p>
                  </Section>
                )}
                {parts.length > 0 && (
                  <Section title="What's in the pack" open>
                    <ul className="divide-y divide-line">
                      {parts.map((x) => (
                        <li key={x.handle} className="flex items-center justify-between py-3 text-[14px]">
                          <Link href={`/products/${x.handle}`} className="font-semibold hover:underline">{x.title}</Link>
                          <span className="text-grey">{formatINR(x.variants[0].price)} alone</span>
                        </li>
                      ))}
                    </ul>
                    <p className="small mt-3">
                      Bought separately: <span className="line-through">{formatINR(parts.reduce((s, x) => s + x.variants[0].price, 0))}</span> · Pack: <span className="font-semibold text-black">{formatINR(v.price)}</span>
                    </p>
                  </Section>
                )}
                <Section title="How to use"><p className="body">Follow the dosage on the label, ideally with a meal. Take consistently for at least 8–12 weeks to assess results.</p></Section>
                <Section title="Shipping & returns"><p className="body">See our <Link href="/policies/shipping" className="text-black underline">shipping policy</Link> and <Link href="/policies/refund" className="text-black underline">refund policy</Link> for delivery times and returns.</p></Section>
              </div>
              <p className="small mt-4">Nutraceutical. Not intended to diagnose, treat, cure or prevent any disease.</p>
            </div>
          </div>
        </div>
      </div>

      <ReviewsSection handle={p.handle} />

      {related.length > 0 && (
        <section className="page pt-24">
          <h2 className="hd-1">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-4">
            {related.map((x) => <ProductCard key={x.handle} product={x} />)}
          </div>
        </section>
      )}
    </>
  );
}
