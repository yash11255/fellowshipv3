// Adds articles.focus_keyword. Usage (dev server stopped): node scripts/migrate-0007-seo.mjs
// For a hosted Postgres, run the same SQL there.
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./.data/pg");
await db.exec(`alter table articles add column if not exists focus_keyword text;`);
console.log("ok: articles.focus_keyword");
await db.close();
