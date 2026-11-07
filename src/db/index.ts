import "server-only";
import * as schema from "./schema";

/**
 * DATABASE_URL set   → real Postgres (production / staging).
 * DATABASE_URL unset → embedded Postgres (PGlite) stored in ./.data/pg for local dev.
 */
async function create() {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    return drizzle(postgres(process.env.DATABASE_URL, { max: 10 }), { schema });
  }
  const { drizzle } = await import("drizzle-orm/pglite");
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite("./.data/pg");
  // PGlite isn't crash-safe: close cleanly when the dev server stops, or the data dir can corrupt.
  const close = () => { pg.close().finally(() => process.exit(0)); };
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
  return drizzle(pg, { schema });
}

type DB = Awaited<ReturnType<typeof create>>;
const g = globalThis as unknown as { __db?: Promise<DB> };

export function db(): Promise<DB> {
  // reuse across hot reloads (PGlite allows a single open instance per directory)
  g.__db ??= create();
  return g.__db;
}

export { schema };
