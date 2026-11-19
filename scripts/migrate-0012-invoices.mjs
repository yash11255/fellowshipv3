// Creates application_payments (one row per captured programme payment / GST invoice).
// Usage: node scripts/migrate-0012-invoices.mjs   (idempotent)
import { openDb } from "./_db.mjs";
const db = await openDb();
await db.exec(`create table if not exists application_payments (
  id serial primary key,
  application_id integer not null references applications(id) on delete cascade,
  invoice_no text not null unique,
  payment_id text not null unique,
  kind text not null,
  amount integer not null,
  taxable integer not null,
  gst integer not null,
  gst_rate integer not null,
  created_at timestamptz not null default now()
);`);
await db.exec(`create index if not exists application_payments_app on application_payments (application_id);`);
await db.exec(`alter table applications add column if not exists fee_includes_gst boolean not null default false;`);
console.log("ok: application_payments, applications.fee_includes_gst");
await db.close();
