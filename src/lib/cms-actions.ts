"use server";

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "./admin";
import { cleanHtml } from "./sanitize";
import { CONTENT_TAG } from "./content";
import { PROGRAMS_TAG } from "./program-store";
import type { Program } from "./programs";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const str = (max: number) => z.string().trim().max(max);
const list = (max: number, n = 40) => z.array(str(max)).max(n).transform((a) => a.filter(Boolean));

// ── Programmes ───────────────────────────────────────────────
const ProgramInput = z.object({
  slug: z.string().regex(SLUG, "URL: lowercase letters, numbers and hyphens"),
  title: str(160).min(3, "Add a title"),
  short: str(400).min(10, "Add a short description"),
  audience: str(160), duration: str(80), format: str(120), schedule: str(120).optional(),
  fee: z.array(z.object({ label: str(80), amount: z.coerce.number().int().min(0).max(10_000_000), note: str(40).optional() })).max(6),
  deposit: z.coerce.number().int().min(0).max(100).optional(),
  image: str(300).min(1, "Choose a cover image"),
  highlights: list(200), outcomes: list(200), eligibility: list(200),
  curriculum: z.array(z.object({ title: str(120), items: list(240, 60) })).max(20),
  nextDates: list(80, 12).optional(),
  gallery: list(300, 24).optional(),
  card: z.object({ name: str(60), line: str(160), meta: str(60), tags: list(40, 6) }).optional(),
  confirm: str(400).optional(),
});

function revalidatePrograms(slug?: string) {
  updateTag(PROGRAMS_TAG);
  revalidatePath("/admin/programs");
  revalidatePath("/programs");
  if (slug) revalidatePath(`/programs/${slug}`);
  revalidatePath("/");
}

export async function saveProgram(originalSlug: string | null, raw: unknown, published: boolean) {
  await requireStaff("manager");
  const p = ProgramInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: `${p.error.issues[0].path.join(" › ") || "Form"}: ${p.error.issues[0].message}` };
  const data = { ...p.data, fee: p.data.fee.filter((f) => f.label && f.amount > 0) } as Program;
  const d = await db();
  try {
    if (originalSlug) {
      await d.update(schema.programs).set({ slug: data.slug, data, published, updatedAt: new Date() }).where(eq(schema.programs.slug, originalSlug));
      if (originalSlug !== data.slug) await d.update(schema.applications).set({ programSlug: data.slug }).where(eq(schema.applications.programSlug, originalSlug));
    } else {
      const n = (await d.select({ s: schema.programs.slug }).from(schema.programs)).length;
      await d.insert(schema.programs).values({ slug: data.slug, data, published, position: n });
    }
  } catch {
    return { ok: false as const, error: "That URL is already used by another programme." };
  }
  revalidatePrograms(data.slug);
  return { ok: true as const, slug: data.slug };
}

export async function setProgramPublished(slug: string, published: boolean) {
  await requireStaff("manager");
  await (await db()).update(schema.programs).set({ published, updatedAt: new Date() }).where(eq(schema.programs.slug, slug));
  revalidatePrograms(slug);
  return { ok: true as const };
}

export async function moveProgram(slug: string, dir: -1 | 1) {
  await requireStaff("manager");
  const d = await db();
  const rows = await d.select({ slug: schema.programs.slug }).from(schema.programs).orderBy(asc(schema.programs.position));
  const i = rows.findIndex((r) => r.slug === slug); const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return { ok: true as const };
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [k, r] of rows.entries()) await d.update(schema.programs).set({ position: k }).where(eq(schema.programs.slug, r.slug));
  revalidatePrograms();
  return { ok: true as const };
}

export async function deleteProgram(slug: string) {
  await requireStaff("owner");
  const d = await db();
  const used = await d.select({ id: schema.applications.id }).from(schema.applications).where(eq(schema.applications.programSlug, slug)).limit(1);
  if (used.length) return { ok: false as const, error: "This programme has applications. Hide it instead of deleting." };
  await d.delete(schema.programs).where(eq(schema.programs.slug, slug));
  revalidatePrograms(slug);
  return { ok: true as const };
}

// ── Blog posts ───────────────────────────────────────────────
const ArticleInput = z.object({
  slug: z.string().regex(SLUG, "URL: lowercase letters, numbers and hyphens").max(120),
  title: str(160).min(3, "Add a title"),
  body: z.string().max(300_000),
  excerpt: str(400).optional().default(""),
  image: str(300).optional().default(""),
  author: str(80).optional().default("Dr. Manu Bora"),
  tags: list(40, 12).optional().default([]),
  focusKeyword: str(80).optional().default(""),
  seoTitle: str(70).optional().default(""),
  seoDescription: str(170).optional().default(""),
  published: z.boolean(),
  publishedAt: z.string().optional(), // ISO; a future date schedules the post
});

export async function saveArticle(originalSlug: string | null, raw: z.input<typeof ArticleInput>) {
  await requireStaff("content");
  const p = ArticleInput.safeParse(raw);
  if (!p.success) return { ok: false as const, error: `${p.error.issues[0].path.join(" › ") || "Form"}: ${p.error.issues[0].message}` };
  const a = p.data;
  const when = a.publishedAt ? new Date(a.publishedAt) : new Date();
  const values = {
    slug: a.slug, title: a.title, body: cleanHtml(a.body), excerpt: a.excerpt, image: a.image || null, author: a.author || "Dr. Manu Bora", tags: a.tags,
    focusKeyword: a.focusKeyword || null, seoTitle: a.seoTitle || null, seoDescription: a.seoDescription || null, published: a.published,
    publishedAt: isNaN(when.getTime()) ? new Date() : when, updatedAt: new Date(),
  };
  const d = await db();
  try {
    if (originalSlug) await d.update(schema.articles).set(values).where(eq(schema.articles.slug, originalSlug));
    else await d.insert(schema.articles).values(values);
  } catch {
    return { ok: false as const, error: "That URL is already used by another post." };
  }
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/blog"); revalidatePath("/journal"); revalidatePath(`/journal/${a.slug}`);
  return { ok: true as const, slug: a.slug };
}

export async function deleteArticle(slug: string) {
  await requireStaff("manager");
  await (await db()).delete(schema.articles).where(eq(schema.articles.slug, slug));
  updateTag(CONTENT_TAG);
  revalidatePath("/admin/blog"); revalidatePath("/journal");
  return { ok: true as const };
}

// ── Images ───────────────────────────────────────────────────
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

/** Saves an uploaded image to public/uploads/YYYY-MM/ (local disk; use object storage when hosting on serverless). */
export async function uploadImage(form: FormData) {
  await requireStaff("content");
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "No file received." };
  const ext = TYPES[file.type];
  if (!ext) return { ok: false as const, error: "Use a JPG, PNG, WebP, AVIF or GIF image." };
  if (file.size > 8 * 1024 * 1024) return { ok: false as const, error: "Image is over 8 MB. Please resize it." };
  const month = new Date().toISOString().slice(0, 7);
  const base = path.basename(file.name, path.extname(file.name)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "image";
  const name = `${base}-${crypto.randomBytes(3).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", month);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return { ok: true as const, url: `/uploads/${month}/${name}` };
}

/** Images available to pick from: uploads first, then the curated college photos, then the old site's media. */
export async function listMedia() {
  await requireStaff("content");
  const root = path.join(process.cwd(), "public");
  const walk = async (rel: string): Promise<string[]> => {
    const out: string[] = [];
    for (const e of await fs.readdir(path.join(root, rel), { withFileTypes: true }).catch(() => [])) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) out.push(...(await walk(r)));
      else if (/\.(jpe?g|png|webp|gif|avif)$/i.test(e.name) && !/-\d+x\d+\./.test(e.name)) out.push(`/${r}`);
    }
    return out;
  };
  const uploads = (await walk("uploads")).sort().reverse();
  return [...uploads, ...(await walk("img")), ...(await walk("brand")), ...(await walk("media"))];
}
