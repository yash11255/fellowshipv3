import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FILTERS, Listing } from "@/components/shop/listing";
import { getProducts, type Goal as GoalT } from "@/lib/catalog";

const INTROS: Record<string, string> = {
  packs: "Doctor-designed 3-in-1 packs. Complementary formulas, one routine, up to 40% less than buying separately.",
  longevity: "NAD+, NMN, resveratrol and senolytics that target cellular ageing.",
  energy: "Support for mitochondrial energy and stamina, without stimulant crashes.",
  "joints-bones": "Cartilage, mobility and bone-density support from an orthopaedic surgeon.",
  "skin-hair-nails": "Collagen, biotin and gut support for skin, hair and nails, from within.",
  sport: "Strength, recovery and endurance for people who train.",
};

export function generateStaticParams() {
  return FILTERS.filter((f) => f.slug).map((f) => ({ goal: f.slug }));
}

function resolve(slug: string) {
  return FILTERS.find((f) => f.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/shop/[goal]">): Promise<Metadata> {
  const { goal } = await params;
  const f = resolve(goal);
  return f ? { title: `${f.label} supplements`, description: INTROS[goal] } : {};
}

export default function GoalPage({ params }: PageProps<"/shop/[goal]">) {
  return (
    <Suspense fallback={<div className="page min-h-[80vh]" aria-busy />}>
      <Goal params={params} />
    </Suspense>
  );
}

async function Goal({ params }: { params: PageProps<"/shop/[goal]">["params"] }) {
  const { goal } = await params;
  const f = resolve(goal);
  if (!f) notFound();
  const products = goal === "packs" ? await getProducts({ kind: "pack" }) : (await getProducts({ goal: goal as GoalT })).filter((p) => p.kind !== "gift");
  return <Listing title={f.label} intro={INTROS[goal]} products={products} active={goal} />;
}
