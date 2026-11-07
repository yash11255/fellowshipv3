import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEFAULT_SETTINGS, type StoreSettings } from "./pricing";
import { DEFAULT_TAX, type TaxSettings } from "./tax";

export const SETTINGS_TAG = "settings";

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const rows = await (await db()).select().from(schema.settings);
  const stored = Object.fromEntries(rows.filter((r) => r.key in DEFAULT_SETTINGS).map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as StoreSettings;
}

// ── Tax ──
export async function getTax(): Promise<TaxSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const [row] = await (await db()).select().from(schema.settings).where(eq(schema.settings.key, "tax"));
  return { ...DEFAULT_TAX, ...((row?.value as Partial<TaxSettings>) ?? {}) };
}

// ── SEO ─────────────────────────────────────────────────────────
export type SeoSettings = {
  siteTitle: string;
  titleTemplate: string;          // use %s for the page title
  siteDescription: string;
  ogImage: string;                // absolute or /public path
  siteUrl: string;
  allowIndexing: boolean;         // false = noindex everywhere (staging)
  ga4Id: string;                  // G-XXXX
  metaPixelId: string;
  gscVerification: string;        // Google Search Console meta token
  organizationName: string;
  instagram: string;
  youtube: string;
};

export const DEFAULT_SEO: SeoSettings = {
  siteTitle: "Arthroscopy College | Fellowship in Arthroscopy by Dr. Manu Bora",
  titleTemplate: "%s | Arthroscopy College",
  siteDescription: "Hands-on Fellowship in Arthroscopy, Advance ACL Internal Brace course and Physiotherapy internship with Dr. Manu Bora, Arthrex Master Instructor. Gurugram, India.",
  ogImage: "/brand/logo.jpg",
  siteUrl: "https://arthroscopycollege.com",
  allowIndexing: true,
  ga4Id: "", metaPixelId: "", gscVerification: "",
  organizationName: "Arthroscopy College",
  instagram: "", youtube: "",
};

export async function getSeo(): Promise<SeoSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  const [row] = await (await db()).select().from(schema.settings).where(eq(schema.settings.key, "seo"));
  return { ...DEFAULT_SEO, ...((row?.value as Partial<SeoSettings>) ?? {}) };
}
