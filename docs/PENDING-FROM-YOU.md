# What's pending from you

## Keys & accounts
| What | Where | Why |
|---|---|---|
| Razorpay keys (test, then live) + webhook secret | Admin → Settings → Payments | Real fee payments. Until then a **test checkout** simulates payment (outside production). |
| Resend API key + verified domain | `.env` → `RESEND_API_KEY`, `EMAIL_FROM` | Sign-in codes, application and payment emails (required in production) |
| Team inbox | `.env` → `TEAM_EMAIL` (defaults to orthosportin@gmail.com) | New application / enquiry / payment alerts |
| Production database | `.env` → `DATABASE_URL` | Local dev uses an embedded DB |
| `AUTH_SECRET`, `SITE_URL`, `ADMIN_EMAILS` | `.env` | Required in production |
| Hosting + DNS | — | Go-live |

## Content to confirm
- **Fellowship fee:** ₹1,50,000 (Fellowship Details page) vs ₹1,00,000 (homepage FAQ). Site uses ₹1,50,000.
- **Fees missing:** Physiotherapy Internship, Online Fellowship (shown as "on request").
- **Dates:** next Next-Gen ACL Course and ACL Rehab Workshop dates (old posters show Nov 2025).
- **Online Fellowship:** syllabus, duration, fee.
- **Legal pages:** the old site had only WordPress placeholder text. Drafts are live at /privacy-policy, /terms-conditions, /disclaimer — have them reviewed, edit in Admin → Content.
- **Dr. Bora quote** on the homepage is a placeholder.
- **Student checklist** on the dashboard ("Before you join") is a sensible default — confirm the list.

## Assets
- Logo as SVG / high-res PNG (current one is 300×120 JPG).
- Arthrex animation video links (the old homepage row) if you want them on the site.
- More recent OT / fellowship photos.

## Admin notes
- **Image uploads** (Blog / Programmes → Upload) save to `public/uploads/` on the server's disk. That works on a VPS; on Vercel/serverless switch to object storage (Cloudflare R2, S3 or Vercel Blob) before launch.
- **Fresh database setup:** `npm run db:push`, then `node scripts/migrate-0007-seo.mjs`, `node scripts/migrate-0008-programs.mjs`, then `npm run db:seed` (programmes, blog import, legal pages).
- Stop the dev server cleanly (Ctrl+C) — the embedded dev database can corrupt if the process is killed.
