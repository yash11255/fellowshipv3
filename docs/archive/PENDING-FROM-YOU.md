# What's pending from you

Everything below blocks launch or is a placeholder I had to guess. Items marked **(admin)** can be filled in yourself at `/admin` → Settings; the rest go in `.env` (see `.env.example`) or need a decision.

## 1. Accounts & keys (blocks launch)
| What | Where it goes | Why |
|---|---|---|
| Razorpay **test** keys (`rzp_test_…`), then **live** keys after KYC | Admin → Settings → Payments **(admin)** | Online payment (UPI/cards). COD works without it. |
| Razorpay webhook secret | Admin → Settings → Payments **(admin)** | Confirms payments if the customer closes the tab |
| Shiprocket API user (email + password) + pickup location name | Admin → Settings → Shipping **(admin)** | Auto shipments, AWB, tracking, pincode checks |
| Delhivery API token + pickup/warehouse name | Admin → Settings → Shipping **(admin)** | Same, for COD routing |
| Warehouse pincode | `.env` → `PICKUP_PINCODE` | Accurate delivery estimates |
| Resend API key + verified sending domain | `.env` → `RESEND_API_KEY`, `EMAIL_FROM` | Sign-in codes, order/shipping/return emails. **Required in production.** |
| Team inbox email | `.env` → `TEAM_EMAIL` | Consultation, contact and return notifications |
| Production database (Neon / Supabase / RDS Postgres) | `.env` → `DATABASE_URL` | Local dev uses an embedded DB |
| `AUTH_SECRET` (`openssl rand -base64 32`) | `.env` | Required in production |
| Hosting (Vercel recommended) + domain DNS | — | Go-live |
| Your admin email(s) | `.env` → `ADMIN_EMAILS` | Owner access |
| GA4 ID, Meta Pixel ID, Search Console token | Admin → Settings → SEO **(admin)** | Analytics & indexing |
| WhatsApp business number | `src/components/assistant/assistant.tsx` (`WHATSAPP`) | Chat "Talk to a human" button (currently a dummy number) |
| Shopify **Admin API** token (read-only) | send to developer | Import past customers & order history (optional) |

## 2. Business decisions / confirmations
- **Tax:** GSTIN, business (origin) state, GST slab per product (default 18% for HSN 2106 nutraceuticals, gift boxes 12%), HSN codes. Confirm with your CA. **(admin → Taxes)**
- **Fees:** free shipping ≥ ₹999, shipping ₹79, COD fee ₹49. Placeholders. **(admin → General)**
- **Delivery routing:** COD → Delhivery, prepaid → Shiprocket? **(admin → Shipping)**
- **Policies used by the chat assistant:** dispatch "1–2 working days", returns "48h for damaged/wrong; opened not returnable", support hours "Mon–Sat 10–7". Make sure these match your imported Refund/Shipping policy pages.
- **Pack pricing:** packs cost about the same as buying the 3 products separately (e.g. Joint Repair Pack ₹2,799 vs ₹2,797), so there's no saving to promote.
- **Stack builder (Dr. Bora to review):** medication exclusion lists (blood thinners, diabetes, BP), first-choice product per goal (`src/lib/stack-engine.ts`).
- **Clinic booking:** callback form for now. Want real slot booking or payments for consultations?

## 3. Product data fixes
- **Longevity Pack:** image shows *Moringa + Collagen + Quercetin*, description says *NMN + Collagen + Quercetin*. Which is right?
- **8 products are sold out** (both NMNs, Resveratrol + Fisetin, Policosanol, Cinnamon, EGCG, Athlete pack, Weight pack): restock or archive. **(admin → Products)**
- **Duplicate SKUs:** Resveratrol + Fisetin reuses EGCG SKUs; Longevity & Longevity Energy packs share `LP_*`.
- **Per-product "How to use"** directions and **structured supplement facts** (currently only in images).
- **Jagran press link:** the old site points it to a Times of India URL. Send the correct link.

## 4. Brand assets
- Logo as **SVG** (only a 165px PNG exists)
- **Clean bottle packshots** on transparent backgrounds (current ones have badge panels baked in; the site crops around them)
- A **portrait photo of Dr. Bora** (current is a wide banner with baked-in text)
- **Brand lifestyle photography** to replace the 14 Unsplash stock photos (`docs/image-credits.md`)

## 5. Still to build (developer side)
- Image upload for products/content (needs Cloudinary or Cloudflare R2 account)
- Admin editors for: homepage sections, stack-builder rules, custom collections
- Subscribe & save (recurring orders via Razorpay Subscriptions)
- SMS / WhatsApp order notifications (needs MSG91 / Interakt / Gupshup account)
- Optional: upgrade the chat assistant to Claude AI (needs an Anthropic API key)
- Before launch: security review, automated end-to-end tests, performance pass, production deploy + DNS cutover
