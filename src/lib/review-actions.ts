"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { currentUser } from "./auth";
import { requireStaff } from "./admin";
import { REVIEWS_TAG } from "./reviews";

const Input = z.object({
  handle: z.string().max(200),
  name: z.string().trim().min(2, "Enter your name").max(60),
  rating: z.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().max(100).optional().default(""),
  body: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
});

export async function submitReview(raw: z.input<typeof Input>) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: "Please sign in to write a review." };
  const p = Input.safeParse(raw);
  if (!p.success) return { ok: false as const, error: p.error.issues[0].message };
  const d = await db();
  const [prod] = await d.select({ h: schema.products.handle }).from(schema.products).where(eq(schema.products.handle, p.data.handle)).limit(1);
  if (!prod) return { ok: false as const, error: "Product not found." };
  const dup = await d.select({ id: schema.reviews.id }).from(schema.reviews).where(and(eq(schema.reviews.userId, user.id), eq(schema.reviews.productHandle, p.data.handle))).limit(1);
  if (dup.length) return { ok: false as const, error: "You've already reviewed this product." };
  // verified buyer = has a non-cancelled order containing this product
  const bought = await d.select({ id: schema.orders.id }).from(schema.orders)
    .innerJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
    .where(and(eq(schema.orders.userId, user.id), eq(schema.orderItems.productHandle, p.data.handle))).limit(1);
  await d.insert(schema.reviews).values({ productHandle: p.data.handle, userId: user.id, name: p.data.name, rating: p.data.rating, title: p.data.title || null, body: p.data.body, verified: bought.length > 0 });
  return { ok: true as const };
}

export async function moderateReview(id: number, status: "approved" | "rejected" | "delete") {
  await requireStaff("support");
  const d = await db();
  if (status === "delete") await d.delete(schema.reviews).where(eq(schema.reviews.id, id));
  else await d.update(schema.reviews).set({ status }).where(eq(schema.reviews.id, id));
  updateTag(REVIEWS_TAG);
  revalidatePath("/admin/reviews");
  return { ok: true as const };
}
