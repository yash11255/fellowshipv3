// Seeds the programs table from src/lib/programs.ts. Existing rows are left alone (admin edits win).
// Usage (dev server stopped): npx tsx scripts/seed-programs.mts [--force]
import { openDb } from "./_db.mjs";
import { PROGRAMS } from "../src/lib/programs.ts";

const force = process.argv.includes("--force");
const db = await openDb();
for (const [i, p] of PROGRAMS.entries()) {
  await db.query(
    `insert into programs (slug, data, position) values ($1, $2, $3) on conflict (slug) do ${force ? "update set data = excluded.data, position = excluded.position, updated_at = now()" : "nothing"}`,
    [p.slug, JSON.stringify(p), i]);
}
console.log(`programs: ${PROGRAMS.length}${force ? " (overwritten)" : ""}`);
await db.close();
