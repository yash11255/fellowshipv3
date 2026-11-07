// One-off: pages, articles, enquiries, returns, checkout drafts (PGlite push limitation).
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite("./.data/pg");
await db.exec(`
  DO $$ BEGIN CREATE TYPE enquiry_kind AS ENUM ('clinic','contact'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  DO $$ BEGIN CREATE TYPE return_status AS ENUM ('requested','approved','rejected','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  CREATE TABLE IF NOT EXISTS pages (slug text PRIMARY KEY, title text NOT NULL, body text NOT NULL DEFAULT '', seo_title text, seo_description text, published boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS articles (slug text PRIMARY KEY, title text NOT NULL, excerpt text NOT NULL DEFAULT '', body text NOT NULL DEFAULT '', image text, author text NOT NULL DEFAULT 'Dr. Manu Bora', tags jsonb NOT NULL DEFAULT '[]', seo_title text, seo_description text, published boolean NOT NULL DEFAULT true, published_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS enquiries (id serial PRIMARY KEY, kind enquiry_kind NOT NULL, name text NOT NULL, email text NOT NULL, phone text, service text, preferred_date text, message text NOT NULL DEFAULT '', handled boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS returns (id serial PRIMARY KEY, order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE, reason text NOT NULL, details text NOT NULL DEFAULT '', status return_status NOT NULL DEFAULT 'requested', refund_amount integer, staff_note text, created_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS checkout_drafts (id serial PRIMARY KEY, token text NOT NULL UNIQUE, email text NOT NULL, phone text, name text, lines jsonb NOT NULL, subtotal integer NOT NULL, recovered_order_id integer, reminder_sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
`);
console.log("content tables ready");
await db.close();
