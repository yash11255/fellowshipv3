import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog";
import { getSeo } from "@/lib/settings";
import { FILTERS } from "@/components/shop/listing";
import { getArticles } from "@/lib/content";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSeo();
  const base = siteUrl.replace(/\/$/, "");
  const products = (await getProducts()).filter((p) => p.kind !== "gift");
  const pages = await (await db()).select({ slug: schema.pages.slug, updatedAt: schema.pages.updatedAt }).from(schema.pages).where(eq(schema.pages.published, true));
  const articles = await getArticles(500);
  return [
    ...["/journal", "/press", "/science", "/dr-manu-bora"].map((u) => ({ url: `${base}${u}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: p.slug.startsWith("policies") ? 0.3 : 0.6 })),
    ...articles.map((a) => ({ url: `${base}/journal/${a.slug}`, lastModified: a.publishedAt, changeFrequency: "monthly" as const, priority: 0.6, images: a.image ? [`${base}${a.image}`] : undefined })),
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/stack-builder`, changeFrequency: "monthly", priority: 0.7 },
    ...FILTERS.filter((f) => f.slug).map((f) => ({ url: `${base}/shop/${f.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/products/${p.handle}`, changeFrequency: "weekly" as const, priority: 0.8, images: p.images.slice(0, 3).map((i) => `${base}${i}`) })),
  ];
}
