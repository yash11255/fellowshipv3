import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

// Storefront catalog, read from the database and cached. Admin mutations call updateTag(CATALOG_TAG).
export const CATALOG_TAG = "catalog";

export type Goal =
  | "longevity" | "energy" | "joints-bones" | "skin-hair-nails" | "gut" | "heart"
  | "metabolic" | "weight" | "sport" | "brain" | "sleep-stress" | "immunity";

export type Variant = { months: number; sku?: string | null; price: number; compareAt: number; available?: boolean };

export type Product = {
  handle: string;
  title: string;
  kind: "single" | "pack" | "gift";
  format?: string | null;
  count?: number | null;
  goals?: Goal[];
  available: boolean;
  variants: Variant[];
  keyActives?: { name: string; mg: number }[];
  includes?: string[];
  description: string;
  images: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export const GOAL_LABELS: Record<Goal, string> = {
  longevity: "Longevity",
  energy: "Energy",
  "joints-bones": "Joints & Bones",
  "skin-hair-nails": "Skin, Hair & Nails",
  gut: "Gut",
  heart: "Heart",
  metabolic: "Metabolic",
  weight: "Weight",
  sport: "Performance",
  brain: "Focus",
  "sleep-stress": "Sleep & Stress",
  immunity: "Immunity",
};

async function loadAll(): Promise<Product[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const d = await db();
  const ps = await d.select().from(schema.products).where(eq(schema.products.status, "active"));
  const vs = await d.select().from(schema.variants).orderBy(asc(schema.variants.months));
  return ps.map((p) => {
    const variants = vs.filter((v) => v.productHandle === p.handle)
      .map((v) => ({ months: v.months, sku: v.sku, price: v.price, compareAt: v.compareAt, available: v.available && (v.stock === null || v.stock > 0) }));
    return {
      handle: p.handle, title: p.title, kind: p.kind, format: p.format, count: p.count,
      goals: p.goals as Goal[], keyActives: p.keyActives, includes: p.includes, description: p.description, images: p.images, seoTitle: p.seoTitle, seoDescription: p.seoDescription,
      variants, available: variants.some((v) => v.available),
    };
  });
}

export async function getProducts(filter?: { kind?: Product["kind"]; goal?: Goal }) {
  const all = await loadAll();
  return all.filter((p) => (!filter?.kind || p.kind === filter.kind) && (!filter?.goal || p.goals?.includes(filter.goal)));
}

export async function getProduct(handle: string) {
  return (await loadAll()).find((p) => p.handle === handle);
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
