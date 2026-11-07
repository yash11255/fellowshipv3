// Idempotent seed: loads prisma/seed-data/products.json into the database.
// Usage: npm run db:seed   (uses DATABASE_URL if set, else local PGlite)
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";

type SeedVariant = { months: number; sku?: string; price: number; compareAt: number; available?: boolean };
type SeedProduct = {
  handle: string; title: string; kind: "single" | "pack" | "gift"; available: boolean; description: string;
  goals?: string[]; keyActives?: { name: string; mg: number }[]; includes?: string[]; format?: string; count?: number;
  variants: SeedVariant[];
};

async function main() {
  const db = process.env.DATABASE_URL
    ? drizzlePg(postgres(process.env.DATABASE_URL), { schema })
    : drizzlePglite(new PGlite("./.data/pg"), { schema });

  const seed = JSON.parse(fs.readFileSync("prisma/seed-data/products.json", "utf8")) as { products: SeedProduct[] };
  for (const p of seed.products) {
    const dir = path.join("public/products", p.handle);
    const images = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => `/products/${p.handle}/${f}`) : [];
    const row = {
      handle: p.handle, title: p.title, kind: p.kind, description: p.description,
      goals: p.goals ?? [], keyActives: p.keyActives ?? [], includes: p.includes ?? [], images,
      format: p.format ?? null, count: p.count ?? null, status: "active",
    };
    await db.insert(schema.products).values(row).onConflictDoUpdate({ target: schema.products.handle, set: { ...row, updatedAt: sql`now()` } });
    for (const v of p.variants) {
      const vr = { productHandle: p.handle, months: v.months, sku: v.sku ?? null, price: v.price, compareAt: v.compareAt, available: p.available && v.available !== false };
      await db.insert(schema.variants).values(vr).onConflictDoUpdate({ target: [schema.variants.productHandle, schema.variants.months], set: vr });
    }
  }
  console.log(`Seeded ${seed.products.length} products.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
