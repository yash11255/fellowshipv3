import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";

export const CONTENT_TAG = "content";

export async function getPage(slug: string) {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const [p] = await (await db()).select().from(schema.pages).where(and(eq(schema.pages.slug, slug), eq(schema.pages.published, true))).limit(1);
  return p ?? null;
}

export async function getPagesUnder(prefix: string) {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  return (await db()).select({ slug: schema.pages.slug, title: schema.pages.title, seoDescription: schema.pages.seoDescription })
    .from(schema.pages).where(and(like(schema.pages.slug, `${prefix}/%`), eq(schema.pages.published, true)));
}

export async function getArticles(limit = 100) {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  return (await db()).select({ slug: schema.articles.slug, title: schema.articles.title, excerpt: schema.articles.excerpt, image: schema.articles.image, publishedAt: schema.articles.publishedAt, author: schema.articles.author })
    .from(schema.articles).where(eq(schema.articles.published, true)).orderBy(desc(schema.articles.publishedAt)).limit(limit);
}

export async function getArticle(slug: string) {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const [a] = await (await db()).select().from(schema.articles).where(and(eq(schema.articles.slug, slug), eq(schema.articles.published, true))).limit(1);
  return a ?? null;
}
