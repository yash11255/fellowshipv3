# Decisions log

## 2026-11-06: Phase 0–1

1. **AI feature = supplement "stack builder"**, not a skin regimen. The catalog is longevity/supplements (see audit §1). Uses a goals + body map; recommends from 20 singles + 9 packs. _Pending owner confirmation._
2. **Data source:** Shopify blocks command-line JSON requests, so the catalog was read via a browser session; images come from the Shopify CDN at original resolution. Final migration should use the Shopify Admin API.
3. **Typography:** Newsreader (display serif, 300) + Inter Tight (UI, close to the current Neue Haas Unica) + Geist Mono (doses, prices, labels). All free via next/font; can swap to licensed faces later.
4. **Palette:** ink `#161513` on bone `#F4F1EA`; the single accent is the logo yellow `#FFC31A`, used only for signals (selection, sale tags, one highlighted phrase). No gradients.
5. **Product data model:** variants = supply length (1/3/12 months); gift-box duplicates become an add-on; packs reference their component products via `includes`.
6. **Temporary data layer:** `src/lib/catalog.ts` reads `prisma/seed-data/products.json` until Prisma/Postgres lands.
7. **Next.js 16.4** with `cacheComponents`; `/` redirects to `/styleguide` until the homepage is built.

## Asset requests for the brand team
- Logo as SVG (only a 165px PNG exists).
- Clean bottle-only packshots on transparent backgrounds (current ones have badge panels baked in).
- Structured supplement-facts per product (currently only inside images).
- A tall portrait crop of Dr. Manu Bora (current asset is a wide banner with baked-in text).

## 2026-11-06: Design v2 (after owner feedback)

Owner rejected v1 (serif + italic accents, mono labels, beige palette) as "typical AI". v2 follows retail/beauty-brand conventions (L'Oréal, Minimalist, Zara):
- Pure white / black, cool grey product tiles; brand yellow only on the logo and a "Popular" marker.
- One family: **Archivo** (variable weight + width). Bold, slightly expanded uppercase headlines; sentence-case body. No serif, no italics, no monospace, no numbered "01/02" sections.
- Retail patterns: campaign hero (Dr. Manu Bora), trust row with line icons, "Shop by concern" tiles, product tiles with always-visible Add to cart, sticky filter chips, PDP with supply selector (1/3/12 months, per-month price and savings), accordions, sticky mobile add-to-cart.
- `Packshot` crops the bottle out of the current renders (they have baked-in badge panels). Remove once clean renders exist.

### Placeholders to confirm
- Free-shipping threshold ₹999 (header, cart progress, trust row).
- "How to use" copy is generic; needs per-product directions.
- Longevity Pack: image shows Moringa + Collagen + Quercetin, description says NMN + Collagen + Quercetin.

## 2026-11-06: Stack builder (Phase 3)
- `/stack-builder`: 5 steps (age → goals via body map/chips, ranked → lifestyle → health check → budget) → results.
- Engine `src/lib/stack-engine.ts` is deterministic: hero product per goal → scoring by goal priority (3/2/1) + lifestyle signals → max 3 picks within budget. Explains every pick; lists exclusions and uncovered goals.
- Safety: pregnancy → consult only; blood thinners / diabetes meds / BP meds / vegetarian exclusions. **Interaction lists need review by Dr. Bora's team before launch.**
- Claude (AI) layer deferred to Phase 5 with the advisor chat: it will rephrase explanations and answer follow-ups, but never choose products outside the engine's candidates.
- Scenario check: `npx tsx scripts/stack-engine-scenarios.ts`.
- Finding: packs are priced at roughly the sum of their parts (Joint Repair Pack ₹2,799 vs ₹2,797 separately), so "save with a pack" rarely triggers. Pricing decision for the brand.

## 2026-11-06: Checkout & accounts (Phase 4)
- **DB:** Drizzle ORM. Dev uses embedded Postgres (PGlite) in `./.data/pg`; production uses `DATABASE_URL` (any Postgres: Neon, Supabase, RDS). Same schema. `npm run db:push`, `npm run db:seed`. Prisma dropped: npm `latest` is an 8.0 RC with a new runtime model.
  - PGlite allows one process at a time: stop `npm run dev` before running `db:push` / `db:seed`.
- **Auth:** passwordless email OTP (6 digits, HMAC-hashed, 10-min expiry, 5 attempts, 45s resend throttle) → 30-day httpOnly session cookie (token hashed in DB). Guest orders attach to the account when that email signs in.
- **Checkout:** server re-prices every line from the DB (client prices ignored; verified with a tampered ₹1 price). Zod validation for Indian mobile and 6-digit pincode. COD works end to end. Razorpay is fully wired (order create → Checkout.js → signature verify → `/api/razorpay/webhook` backstop) but hidden until `RAZORPAY_KEY_ID/SECRET` are set.
- Order numbers `RC-1000NN` derive from the serial id (race-free). Guests view orders via an HMAC-signed link; owners via session.
- Emails go through Resend when `RESEND_API_KEY` is set; otherwise they print to the dev console.
- **Placeholders to confirm:** shipping ₹79 below ₹999, COD fee ₹49 (`src/lib/pricing.ts`).
- Storefront pages still read the JSON seed; they move to the DB with the admin panel (Phase 6) so edits show live.
- Not yet: discount codes, pincode serviceability, stock decrement, GST invoice, shipping integration (Phase 6–7). Security review before go-live (Phase 7).

## 2026-11-06: Admin panel v1 (Phase 6)
- `/admin`: Dashboard (14-day revenue, orders, AOV, to-fulfil, daily revenue chart, top products, recent orders, sold-out list), Orders (status tabs, search, detail with fulfilment actions + internal notes), Products (list + editor: title, description, status, per-variant price/compare-at/stock/SKU/selling), Customers (grouped by email incl. guests, orders, spend).
- Access: roles on `users` (customer/support/content/manager/owner). `ADMIN_EMAILS` (env) promotes listed emails to owner at sign-in. Every admin page and server action calls `requireStaff()`. Layout gating alone isn't enough in Next.js. Non-staff get 404. Product edits need manager+.
- Storefront catalog now reads from the DB (`'use cache'` + `cacheTag("catalog")`); admin saves call `updateTag` so changes are live on the next request (verified: price edit showed on PDP, JSON-LD and Shop instantly).
- Stock: a variant with stock 0 shows sold out; empty stock = not tracked. Orders don't decrement stock yet.
- **Not yet in admin:** discounts/coupons, collections, homepage/content editor, stack-builder rules editor, staff management UI, media upload (needs Cloudinary/R2), GST invoices, CSV import/export, abandoned carts, settings (fees, shipping), audit log.

## 2026-11-06: Discounts, settings, SEO, payments, shipping, tax
- **Discounts:** percent (with optional cap) / fixed / free shipping; min order, start/end, total-use limit (claimed atomically), once-per-customer. Code applied in checkout; server re-validates.
- **Store settings:** free-shipping threshold, shipping fee, COD fee, COD on/off, announcement bar (Admin → Settings → General). Read by cart, checkout and server.
- **Stock:** tracked variants decrement in the order transaction with an oversell guard.
- **SEO:** admin-editable site title/template/description/OG image/canonical URL/indexing switch/GA4/Meta Pixel/Search Console token; per-product SEO title & meta description with Google preview; `/sitemap.xml`, `/robots.txt`, Organization + Product + Breadcrumb JSON-LD, canonical URLs.
- **Payments:** Razorpay keys can be entered in admin (encrypted at rest, AES-256-GCM keyed from AUTH_SECRET) with "Test connection"; env vars still work as fallback. It was never broken, just unconfigured.
- **Shipping:** adapters for Shiprocket (adhoc order + AWB assign) and Delhivery (CMU create) plus Manual. Routing: separate default partner for COD vs prepaid; staff can override per order. Tracking emailed to customer and shown on their order page. **Shiprocket/Delhivery calls are written to their public APIs but untested until real credentials are added.**
- **Tax:** GST slab manager (editable slabs, default 18% for HSN 2106 nutraceuticals, gift boxes 12%: confirm with CA), GSTIN, business state, per-product slab + HSN. Orders store per-line rate + HSN, tax total and CGST/SGST vs IGST split.
- **Login:** redesigned split layout; 6-box code entry with paste; dev-only on-screen code and test-account buttons.
- Local DB was corrupted once by a hard stop; recreated (test data lost) and a clean-shutdown hook added. drizzle-kit push on PGlite can't run multi-statement diffs → `scripts/migrate-0004-tax.mjs`.

## 2026-11-06: Invoices, exports, staff, reviews, pincode, search, assistant, responsive
- **GST invoice** at `/invoice/[number]` (staff, owner, or signed link). Per-line HSN/taxable/CGST+SGST or IGST, shipping line (SAC 996812). Print → Save as PDF. Links in admin order + customer order page.
- **CSV exports** (orders, customers, products) with formula-injection guard, staff only.
- **Staff**: owners add/remove staff by email with roles (owner/manager/support/content); can't demote yourself.
- **Reviews**: signed-in customers submit; "Verified buyer" if they ordered it; moderation queue in admin; approved reviews + rating summary on PDP; AggregateRating in Product JSON-LD (Google stars).
- **Pincode check** on PDP: Delhivery or Shiprocket serviceability when connected, otherwise zone-based estimate; COD availability.
- **Search**: animated overlay (`/` or ⌘K), synonym-aware instant results, keyboard nav, popular + concerns; `/search` results page; `/api/search` index (cached).
- **Assistant**: rule-based (no external AI): safety intents first (pregnancy, medication, emergency → no product push), FAQs (delivery, COD, returns, payments, tracking, dosage, veg), concern → doctor's hero products with Add to cart, catalog lookup, WhatsApp handoff.
  - **Placeholders to confirm:** WhatsApp number, support hours, dispatch time (1–2 days), returns policy wording (48h damaged/wrong item; opened supplements non-returnable).
- **Responsive**: all 22 storefront + admin routes checked at 375px with no horizontal overflow. Mobile hero re-cropped to hide the banner's baked caption; chat button icon-only on mobile.
- Reviews table via `scripts/migrate-0005-reviews.mjs` (PGlite push limitation).

## 2026-11-06: Hero film + As Seen In (from original site)
- Hero now uses the brand film from the Shopify site: landscape (1280×720) on desktop, portrait (720×1280) on mobile, ~1 MB each, `public/video/`. Posters extracted with ffmpeg for instant first paint; reduced-motion users see the still; pause button (WCAG 2.2.2). Split layout (text left, film right) because the film's white backdrop + centred subject leaves no room for overlaid text.
- "As seen in": 9 feature cards (outlet logo, headline, link to the **original article**, not the old Shopify page) + the existing logo row. Logos in `public/press/`.
- Omitted the Jagran card: the original site links it to a Times of India URL (data error). Add back when the correct Jagran link is known.
- The doctor banner moved out of the hero; Dr. Bora still has his own section further down.

## 2026-11-06: Content, journal, inbox, returns, abandoned carts, redirects
- **Pages CMS:** 16 Shopify pages imported (about, FAQ, contact, 4 policies, clinic + 8 services) via `scripts/import-content.mjs`: theme widgets dropped, HTML sanitised (allow-list), images downloaded to `public/content/`, internal links rewritten. Rendered by a catch-all route; clinic pages get the booking form, /contact the contact form.
- **Journal:** 45 articles imported with original publish dates; listing, article pages with Article JSON-LD, "keep reading". Admin → Content edits pages and articles (HTML + live preview, snippets, SEO, publish toggle); HTML is re-sanitised on save.
- **New pages:** /dr-manu-bora (Person JSON-LD), /press, /science (doses table from the catalog).
- **Inbox:** clinic consultation + contact forms (honeypot + 3/hour rate limit), team email notification, Admin → Inbox.
- **Returns:** customers request from the order page (after shipping); Admin → Returns approve / reject / mark refunded (emails customer; marks order refunded).
- **Abandoned checkouts:** draft saved once the checkout has an email; cleared when an order is placed; Admin → Abandoned carts shows value, copy recovery link, email reminder; `/checkout?recover=TOKEN` refills the cart.
- **SEO:** sitemap now 110 URLs (pages + journal). 308 redirects from all old Shopify URL patterns (/pages, /blogs, /collections, /policies, /account/login).
- Pending items for the owner consolidated in `docs/PENDING-FROM-YOU.md`.
