# Deploying to Vercel (demo setup: Vercel Postgres + Vercel Redis)

This app needs Postgres (Drizzle schema, 31 files depend on it: auth, applications,
payments, content) and now optionally uses Redis for caching/rate-limiting via
`src/lib/redis.ts`. Locally it falls back to an embedded Postgres (PGlite) and a
no-op Redis client, but **Vercel's serverless functions are stateless and
read-only outside `/tmp`**, so PGlite's file-based `.data/pg` won't work there —
you need a real Postgres connection string for any deploy.

## 1. Create the Vercel project
1. Push this repo to GitHub (you said you'll provide this next).
2. Vercel dashboard → **Add New → Project** → import the repo.
3. `vercel.json` already sets framework, install/build commands (pnpm) and the
   `bom1` (Mumbai) region. No other config needed here.

## 2. Add a free Postgres (Vercel Marketplace)
1. Project → **Storage** tab → **Create Database** → pick **Neon** or **Supabase**
   (both have a free tier through the Vercel Marketplace).
2. Connect it to this project. Vercel injects `DATABASE_URL` (or `POSTGRES_URL` —
   if you get the latter, also add it to the project env vars as `DATABASE_URL`
   so `src/db/index.ts` picks it up) automatically into all environments.

## 3. Add Redis (Vercel Marketplace → Upstash)
1. Project → **Storage** tab → **Create Database** → **Redis** (Upstash).
2. Connect it to this project. This injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN`, which `src/lib/redis.ts` reads automatically.
3. After deploy, hit `/api/redis-check` — it increments a counter in Redis and
   returns it, so you can confirm the integration is actually wired up.
   `{"ok":false,"configured":false,...}` means the env vars aren't set yet.

## 4. Set the remaining env vars
In Project → Settings → Environment Variables, add (see `.env.example` for the
full list/descriptions):
- `AUTH_SECRET` — required in production. Generate with `openssl rand -base64 32`.
- `SITE_URL` — your Vercel deployment URL (e.g. `https://arthroscopy-college.vercel.app`).
- `ADMIN_EMAILS` — comma-separated emails that become admin on first sign-in.
- `TEAM_EMAIL` — where application/enquiry notifications go.
- `PAYMENTS_TEST_MODE=1` — already set as a default in `vercel.json` so the
  dummy checkout works without real Razorpay keys. Remove once you add real
  `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`.
- `RESEND_API_KEY` + `EMAIL_FROM`, or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`
  — without either, sign-in codes only show in Admin → Emails (fine for a demo,
  but nobody gets a real email).

## 5. First-time database setup (run once, after step 2)
Pull the real `DATABASE_URL` down locally, then push the schema + run the
one-off migrations + seed content:

```bash
npx vercel link            # link this folder to the Vercel project (first time only)
npx vercel env pull .env.local
pnpm db:setup               # push schema, run migrate-0007..0010, then db:seed
```

`db:setup` is a new script (added to `package.json`) that chains:
`drizzle-kit push --force` → the four `migrate-00XX-*.mjs` scripts → `db:seed`
(programs, blog import, legal pages). Re-running it is safe for the push/seed
parts but **not guaranteed idempotent for the four migrate scripts** — only
run it once against a fresh database.

## 6. Known limitation for this demo: image uploads
`src/lib/cms-actions.ts` saves admin-uploaded images to `public/uploads/` on
local disk. That works on a VPS but **not on Vercel** (serverless functions
don't share a writable filesystem across requests/deploys). Uploads will
appear to work and then vanish. This was already flagged in
`docs/PENDING-FROM-YOU.md` before this deploy — switching it to Vercel Blob,
Cloudflare R2 or S3 is a separate piece of work, not done as part of this
Vercel/Redis setup.

## 7. Lockfile note
Both `package-lock.json` and `pnpm-lock.yaml` exist in this repo, but the
project's `node_modules` is actually pnpm-managed, and `vercel.json` installs
with pnpm. Commit the refreshed `pnpm-lock.yaml` (now includes `@upstash/redis`)
and delete `package-lock.json` to avoid confusing Vercel's package-manager
auto-detection:

```bash
rm package-lock.json
git add pnpm-lock.yaml package-lock.json
git commit -m "Standardize on pnpm"
```
