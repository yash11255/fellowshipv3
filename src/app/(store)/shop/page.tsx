import type { Metadata } from "next";
import { Listing } from "@/components/shop/listing";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all supplements",
  description: "Longevity, energy, joint, gut and performance supplements formulated by Dr. Manu Bora.",
};

export default async function Shop() {
  const products = (await getProducts()).filter((p) => p.kind !== "gift");
  return <Listing title="Shop all" intro="Every formula and pack, with every dose disclosed." products={products} active="" />;
}
