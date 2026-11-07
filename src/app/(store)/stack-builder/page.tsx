import type { Metadata } from "next";
import { StackBuilder } from "@/components/stack/stack-builder";
import { getProducts } from "@/lib/catalog";
import type { StackProduct } from "@/lib/stack-engine";

export const metadata: Metadata = {
  title: "Find your stack",
  description: "Answer five quick questions and get a personalised supplement stack from Reverse Clinics, with the reason behind every pick.",
};

export default async function Page() {
  const products: StackProduct[] = (await getProducts())
    .filter((p) => p.available && (p.kind === "single" || p.kind === "pack"))
    .map((p) => ({
      handle: p.handle,
      title: p.title,
      kind: p.kind as "single" | "pack",
      goals: p.goals ?? [],
      image: p.images[0],
      price: p.variants[0].price,
      compareAt: p.variants[0].compareAt,
      includes: p.includes,
      keyActive: p.keyActives?.[0] ? `${p.keyActives[0].name} ${p.keyActives[0].mg}mg` : undefined,
    }));

  return <StackBuilder products={products} />;
}
