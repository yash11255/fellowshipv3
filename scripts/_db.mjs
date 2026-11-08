// Script DB helper: uses DATABASE_URL (Postgres) when set, otherwise the embedded PGlite dev DB.
import fs from "node:fs";
for (const f of [".env.local", ".env"]) if (fs.existsSync(f)) for (const l of fs.readFileSync(f, "utf8").split("\n")) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, ""); }

export async function openDb() {
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
    return { query: (q, p = []) => sql.unsafe(q, p).then((rows) => ({ rows })), exec: (q) => sql.unsafe(q), close: () => sql.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite("./.data/pg");
  return { query: (q, p) => db.query(q, p), exec: (q) => db.exec(q), close: () => db.close() };
}
