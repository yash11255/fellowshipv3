// One-off: reviews table (drizzle-kit push can't run multi-statement changes on PGlite).
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./.data/pg");
await db.exec(`
  DO $$ BEGIN CREATE TYPE review_status AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS reviews (
    id serial PRIMARY KEY,
    product_handle text NOT NULL REFERENCES products(handle) ON DELETE CASCADE,
    user_id integer REFERENCES users(id) ON DELETE SET NULL,
    name text NOT NULL, rating integer NOT NULL, title text, body text NOT NULL,
    verified boolean NOT NULL DEFAULT false, status review_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS reviews_product ON reviews (product_handle, status);
`);
console.log("reviews table ready");
await db.close();
