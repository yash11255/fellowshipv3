# Reverse Clinics — Phase 0 Audit

_Crawled 2026-11-06 from reverseclinics.com (Shopify, theme t/10, INR, India)._

## 1. The big finding: what the brand actually is

Reverse Clinics is **not a skincare brand**. It is a **longevity / anti-ageing supplements brand** plus a **clinic services** arm, fronted by **Dr. Manu Bora** (sports-medicine surgeon and model, the brand's face).

- Tagline: _"re-verse your age."_ Homepage H1: _"Support Healthy Ageing. Support Energy. Live Better"_
- Positioning: _"Born From Science, Built for Longevity"_, "Reverse Your Epigenetic Age"
- Product lines: NMN, liposomal NMN + resveratrol, NAD+ shots, resveratrol + fisetin, ALA, quercetin + bromelain, policosanol, cinnamon + chromium, EGCG green tea, collagen (skin / joint / bone), omega-3, magnesium, creatine, sports and hair-skin-nail multivitamins, pre+probiotic, moringa + curcumin, shilajit gold, plus **goal packs** (Longevity, Energy, Stamina, Joint Repair, Bone Health, Hair-Nail-Skin, Weight Management, Athlete) and gift wooden boxes.
- Clinic services pages: Supplements, Joint, Skin, Hair, Sports Injury, Psychology, Nutrition, Muscles.

**Consequence for the build:** the "Find Your Regimen" feature becomes a **longevity / goals stack builder** (energy, ageing, joints, gut, sleep/stress, skin-hair-nails, sport performance, weight, blood sugar, heart), not a face map. A **body map** (joints, gut, heart, brain, skin/hair) replaces the face map. Design references shift toward **Seed, Ritual, AG1, Function Health, Hims, Apple Health** with Minimalist's ingredient-and-dose honesty (mg per serving instead of % actives).

## 2. Catalog

37 Shopify products = **20 single supplements + 9 goal packs + 2 gift boxes + 6 duplicate "with gift box" packs**. Full data: `prisma/seed-data/products.json`.

**Pricing model:** every product has 3 variants = supply length: **1 month / 3 months (~25% off) / 12 months (~40% off)**. That maps naturally to subscribe-and-save. Singles cost ₹499–₹3,199/mo; packs ₹2,279–₹4,499/mo.

| Line | Products |
|---|---|
| Longevity / NAD+ | NMN 1000mg, Liposomal NMN + Resveratrol, NAD+ Shots, Resveratrol + Fisetin, Quercetin + Bromelain |
| Metabolic / heart | ALA 300mg, Cinnamon + Chromium, EGCG Green Tea, Policosanol |
| Joints / bones | Collagen Joint Repair, Collagen Bone Health, Moringa + Curcumin, Omega-3 |
| Skin-hair-nails / gut | Collagen Skin Age Rewind, Hair-Nail-Skin Multi, Pre + Probiotic |
| Sport / energy | Creatine, Sports Multi, Shilajit Gold, Magnesium |
| Packs (3-in-1 stacks by Dr. Manu Bora) | Longevity, Longevity Energy, Joint Repair, Bone Health, Hair Nail Skin, Stamina, Stamina + Creatine, Athlete Longevity, Weight Management |

**Data issues to fix in migration:**
- 8 products are **sold out** (both NMNs, Resveratrol + Fisetin, Policosanol, Cinnamon, EGCG, Athlete pack, Weight pack).
- 6 packs are duplicated as "+ wooden tissue box" products → merge into one product with a **gift box add-on** and 301 the old handles.
- Handles with `-copy` / typo (`stamina-pack-with-ceratine`) → clean handles + 301.
- Duplicate SKUs: Resveratrol + Fisetin reuses EGCG's SKUs; Longevity and Longevity Energy packs share `LP_*` SKUs. Many variants have no SKU.
- `product_type`, tags and structured ingredient data are almost all empty. Ingredients and doses sit inside descriptions/images, so I extracted key actives (mg) where they're stated. **Full supplement-facts per product are needed from the team** (the stack builder depends on them).
- Policosanol and Weight pack 1-month variants have no compare-at price.
- Product galleries (7–29 images each, 487 total) mix renders, lifestyle shots, WhatsApp photos, infographic "creatives" and a shared doctor-badge image. These need curating to 5–7 hero images per product for the new design.

## 3. Collections (Shopify)

| Handle | Products | Keep? |
|---|---|---|
| shop | 31 | Yes → `/shop` |
| frontpage | 22 | Internal (homepage) |
| featured-products | 15 | Becomes "Bestsellers" flag |
| pre-launch | 19 | Review |
| b1g1-offer | 11 | Becomes a discount rule, not a collection |
| rakhi-festival-pack | 3 | Seasonal → campaign collection |
| reelup-do-not-delete | 15 | App artefact, drop |
| e-books-1 | 0 | Drop |

Proposed real collections by goal: Longevity & NAD+, Energy, Joints & Bones, Gut, Heart & Metabolic, Skin-Hair-Nails, Sport & Performance, Weight, Packs & Gifts.

## 4. Pages & content

- **Legal / support:** contact, about-us, faqs, terms, privacy, refund, shipping.
- **Services:** services, supplements, joint, skin, hair, sports-injury, psychology, nutrition, muscles → become `/clinic/*` with consultation booking.
- **Press/PR pages (8)** about Dr. Manu Bora → consolidate into `/press` + doctor profile.
- **Blog:** two blogs (`news`, `cellular-health`), 45 articles (many weight-loss/Indian-diet SEO posts, several duplicate slugs like `-1`, `2`). Keep all, fix duplicates with 301s.
- Odd pages to retire: `copy-of-antiaging`, `pre-launch`.

## 5. Features & third-party apps detected

| Feature | Source | Rebuild plan |
|---|---|---|
| Email marketing | Klaviyo | Keep Klaviyo via API (or Resend) |
| Shoppable video reels | ReelUp | Native video/reels section |
| WhatsApp chat | wa.me link | Keep button + advisor escalation |
| Analytics | GTM/GA4, Meta Pixel | Keep + server-side events |
| Quiz | theme quiz settings | Replaced by Regimen/Stack builder |
| Subscriptions | references present | Native subscribe & save |
| Predictive search, quick cart | theme | Native |
| Press logos | Forbes, Guardian, Health, Vogue, … | "As seen in" strip |
| `reverse-clinic.jaka.app` | external app link | **Unknown, need to confirm what it does** |

Not detected: a reviews app (Judge.me/Loox/Yotpo), Razorpay/GoKwik/Shiprocket scripts on the homepage (checkout is Shopify's, so payment/shipping providers need confirming).

## 6. Brand tokens (current)

- Logo: wordmark "Reverse" with a yellow curved-arrow mark + "re-verse your age." → `public/brand/logo-black.png`, `logo-white.png` (PNG only, **no SVG found: request vector from the team**).
- Font: Neue Haas Unica (theme). Colors: #232323 text on white, yellow accent from the logo.
- Imagery: Dr. Manu Bora portrait, product renders, press logos, benefit icons (`Frame_1948757950-*`).

## 7. Assets downloaded

`public/brand/`: logos (black/white), Dr. Manu Bora portrait, 6 press logos, 7 benefit icons, support icon, promo banner. Product images: see section 9.

## 8. Proposed sitemap (new)

```
/                         Home
/shop                     All products (filters: goal, ingredient, format, price)
/shop/[goal]              Goal collections
/products/[handle]        PDP (same handles as Shopify → no redirects needed)
/packs                    Goal packs & gifting
/stack-builder            AI "Find Your Stack" experience  (+ /stack/[id] shared results)
/science                  Ingredients library  → /science/[ingredient]
/clinic                   Services overview → /clinic/[service] + /clinic/book
/dr-manu-bora             Founder / medical authority
/press                    Media coverage
/journal                  Blog → /journal/[slug]   (301 from /blogs/news/*, /blogs/cellular-health/*)
/about /faq /contact
/policies/[shipping|refund|privacy|terms]   (301 from /pages/*)
/cart  /checkout  /account/*  /search
/admin/*                  Admin panel
```

## 9. Status & open questions

- **Data collection:** Shopify rate-limited command-line requests, so the catalog was read through a real browser session. Images come straight from the Shopify CDN at original resolution (`scripts/download-images.sh`, re-runnable).
- **Questions for you:**
  1. Confirm the AI feature should be a **supplement stack builder** (goals + body map) instead of a skin regimen.
  2. Should clinic services include **online booking** (with which calendar/payment)?
  3. What is `reverse-clinic.jaka.app`?
  4. Payment gateway and shipping partner currently used at checkout?
  5. Can you share the logo as SVG, plus original product photography (higher-res than the web store)?
  6. Can you give Shopify Admin API access? It's the reliable way to get full product data, customers and orders without rate limits.
