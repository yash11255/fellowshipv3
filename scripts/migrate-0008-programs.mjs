// Creates the programs table (editable programme content). Usage (dev server stopped): node scripts/migrate-0008-programs.mjs
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./.data/pg");
await db.exec(`create table if not exists programs (
  slug text primary key, data jsonb not null, position integer not null default 0,
  published boolean not null default true, updated_at timestamptz not null default now());`);
console.log("ok: programs");
await db.close();
