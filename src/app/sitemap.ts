import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getSeo } from "@/lib/settings";
import { getArticles } from "@/lib/content";
import { PROGRAMS } from "@/lib/programs";
import { db, schema } from "@/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { siteUrl } = await getSeo();
  const base = siteUrl.replace(/\/$/, "");
  const pages = await (await db()).select({ slug: schema.pages.slug, updatedAt: schema.pages.updatedAt }).from(schema.pages).where(eq(schema.pages.published, true));
  const articles = await getArticles(500);
  const fixed = new Set(["contact-us"]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/programs`, changeFrequency: "weekly", priority: 0.9 },
    ...PROGRAMS.map((p) => ({ url: `${base}/programs/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9, images: [`${base}${p.image}`] })),
    ...["/apply", "/dr-manu-bora", "/videos", "/gallery", "/journal", "/contact-us"].map((u) => ({ url: `${base}${u}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...pages.filter((p) => !fixed.has(p.slug)).map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...articles.map((a) => ({ url: `${base}/journal/${a.slug}`, lastModified: a.publishedAt, changeFrequency: "monthly" as const, priority: 0.6, images: a.image ? [`${base}${a.image}`] : undefined })),
  ];
}
