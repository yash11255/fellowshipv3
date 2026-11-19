import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { PROGRAMS, type Program } from "./programs";

export const PROGRAMS_TAG = "programs";
export type ProgramRow = Program & { published: boolean; position: number };

/** Programmes from the DB (Admin → Programmes), falling back to the built-in defaults if the table is empty. */
export async function getAllPrograms(): Promise<ProgramRow[]> {
  "use cache";
  cacheTag(PROGRAMS_TAG);
  cacheLife("hours");
  const rows = await (await db()).select().from(schema.programs).orderBy(asc(schema.programs.position));
  if (!rows.length) return PROGRAMS.map((p, i) => ({ ...p, published: true, position: i }));
  // Guard against legacy rows saved before a field (e.g. fee, highlights) existed: default to the built-in
  // program with the same slug when available, otherwise to safe empty values, so a stale row never crashes rendering.
  return rows.map((r) => {
    const base = PROGRAMS.find((p) => p.slug === r.slug);
    const merged = { ...base, ...r.data, slug: r.slug, published: r.published, position: r.position } as ProgramRow;
    return {
      ...merged,
      fee: merged.fee ?? [],
      highlights: merged.highlights ?? [],
      curriculum: merged.curriculum ?? [],
      outcomes: merged.outcomes ?? [],
      eligibility: merged.eligibility ?? [],
    };
  });
}

export async function getPrograms() {
  return (await getAllPrograms()).filter((p) => p.published);
}

export async function getProgramBySlug(slug: string) {
  return (await getAllPrograms()).find((p) => p.slug === slug) ?? null;
}

export async function programTitle(slug: string) {
  return (await getProgramBySlug(slug))?.title ?? slug;
}

