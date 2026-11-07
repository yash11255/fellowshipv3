import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const REVIEWS_TAG = "reviews";

export async function getReviews(handle: string) {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("hours");
  const rows = await (await db()).select({ id: schema.reviews.id, name: schema.reviews.name, rating: schema.reviews.rating, title: schema.reviews.title, body: schema.reviews.body, verified: schema.reviews.verified, createdAt: schema.reviews.createdAt })
    .from(schema.reviews).where(and(eq(schema.reviews.productHandle, handle), eq(schema.reviews.status, "approved"))).orderBy(desc(schema.reviews.createdAt)).limit(50);
  const count = rows.length;
  const avg = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const dist = [5, 4, 3, 2, 1].map((n) => rows.filter((r) => r.rating === n).length);
  return { rows, count, avg, dist };
}
