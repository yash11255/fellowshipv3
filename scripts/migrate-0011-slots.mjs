// Creates program_slots and adds slot/balance columns to applications.
// Usage (dev server stopped): node scripts/migrate-0011-slots.mjs
import { openDb } from "./_db.mjs";
const db = await openDb();

await db.exec(`create table if not exists program_slots (
  id serial primary key,
  program_slug text not null,
  label text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  capacity integer not null,
  confirmed_count integer not null default 0,
  balance_due_days integer not null default 14,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);`);
await db.exec(`create index if not exists slots_program on program_slots (program_slug, status);`);

await db.exec(`alter table applications add column if not exists slot_id integer references program_slots(id) on delete set null;`);
await db.exec(`alter table applications add column if not exists amount_paid integer not null default 0;`);
await db.exec(`alter table applications add column if not exists balance_due_at timestamptz;`);

console.log("ok: program_slots, applications.slot_id / amount_paid / balance_due_at");
await db.close();
