// Adds password columns to users. Usage: node scripts/migrate-0010-passwords.mjs
import { openDb } from "./_db.mjs";
const db = await openDb();
await db.exec(`alter table users add column if not exists password_hash text;
alter table users add column if not exists failed_logins integer not null default 0;
alter table users add column if not exists locked_until timestamptz;`);
console.log("ok: users password columns");
await db.close();
