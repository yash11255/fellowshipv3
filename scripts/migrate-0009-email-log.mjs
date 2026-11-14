// Creates the email_log table. Usage: node scripts/migrate-0009-email-log.mjs
import { openDb } from "./_db.mjs";
const db = await openDb();
await db.exec(`create table if not exists email_log (id serial primary key, "to" text not null, subject text not null, body text not null,
  provider text not null, status text not null, error text, created_at timestamptz not null default now());`);
console.log("ok: email_log");
await db.close();
