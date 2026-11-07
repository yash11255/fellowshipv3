# Testing guide (local)

Start: `npm run dev -- -p 3100` → http://localhost:3100

## Test accounts (development only)
Sign-in is passwordless. In development (no `RESEND_API_KEY`), the 6-digit code is **shown on the sign-in page**. Click it to fill.

| Role | Email | Where |
|---|---|---|
| Store admin (owner) | `admin@reverseclinics.test` | http://localhost:3100/login?next=/admin |
| Customer | `customer@reverseclinics.test` | http://localhost:3100/login |

The sign-in page also has one-click buttons for both. Admin access comes from `ADMIN_EMAILS` in `.env.local`; add your own email there (comma-separated) and restart to make yourself an owner.

## Test data
- Discount code: **WELCOME10** (10% off, min ₹500). Create more in Admin → Discounts.
- Payment: Cash on Delivery works now. Razorpay: Admin → Settings → Payments, paste **test** keys (`rzp_test_…`), then pay with UPI `success@razorpay` or card `4111 1111 1111 1111`, any future expiry, any CVV.
- Shipping: "Manual" works without accounts. Shiprocket/Delhivery need API credentials in Admin → Settings → Shipping (Test connection button included).
- Pincodes: any valid 6-digit (e.g. 110001 Delhi = CGST+SGST, 560025 Bengaluru = IGST).

## What to try
1. Shop → add to cart → checkout with WELCOME10 → COD → order confirmation.
2. Admin → Orders → ship it (Manual, any AWB) → customer order page shows tracking.
3. Admin → Products → change a price/stock/SEO title → storefront updates immediately.
4. Admin → Settings → General: change free-shipping threshold / COD fee / announcement.
5. Admin → Settings → SEO: titles, GA4, Meta Pixel; check /sitemap.xml and /robots.txt.
6. Admin → Settings → Taxes: GST slabs, GSTIN, business state.

## Notes
- Local DB lives in `.data/pg` (embedded Postgres). Stop the dev server before running `npm run db:push` / `db:seed`.
- Emails print in the dev-server terminal.
