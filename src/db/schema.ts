import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const productKind = pgEnum("product_kind", ["single", "pack", "gift"]);
export const orderStatus = pgEnum("order_status", ["pending_payment", "confirmed", "paid", "shipped", "delivered", "cancelled", "refunded"]);
export const paymentMethod = pgEnum("payment_method", ["cod", "razorpay"]);
export const role = pgEnum("role", ["customer", "support", "content", "manager", "owner"]);
export const enquiryKind = pgEnum("enquiry_kind", ["clinic", "contact"]);
export const returnStatus = pgEnum("return_status", ["requested", "approved", "rejected", "refunded"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const discountType = pgEnum("discount_type", ["percent", "fixed", "free_shipping"]);

// ── Catalog ─────────────────────────────────────────────────────
export const products = pgTable("products", {
  handle: text("handle").primaryKey(),
  title: text("title").notNull(),
  kind: productKind("kind").notNull(),
  status: text("status").notNull().default("active"), // active | draft | archived
  description: text("description").notNull().default(""),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  keyActives: jsonb("key_actives").$type<{ name: string; mg: number }[]>().notNull().default([]),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  format: text("format"),
  count: integer("count"),
  taxSlab: text("tax_slab").notNull().default("gst18"),   // id from Settings → Taxes
  hsn: text("hsn"),                                         // HSN code for GST invoices
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  productHandle: text("product_handle").notNull().references(() => products.handle, { onDelete: "cascade" }),
  months: integer("months").notNull(),
  sku: text("sku"),
  price: integer("price").notNull(),          // INR, whole rupees
  compareAt: integer("compare_at").notNull().default(0),
  available: boolean("available").notNull().default(true),
  stock: integer("stock"),                     // null = not tracked
}, (t) => [uniqueIndex("variant_product_months").on(t.productHandle, t.months)]);

// ── Customers & auth ────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  phone: text("phone"),
  role: role("role").notNull().default("customer"),
  passwordHash: text("password_hash"),           // scrypt; null until the user sets a password
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("otp_email").on(t.email)]);

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Address = { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Address>().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

// ── Orders ──────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),   // RC-100001
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  status: orderStatus("status").notNull(),
  paymentMethod: paymentMethod("payment_method").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  discountCode: text("discount_code"),
  shipping: integer("shipping").notNull(),
  codFee: integer("cod_fee").notNull().default(0),
  total: integer("total").notNull(),
  taxTotal: integer("tax_total").notNull().default(0),     // GST included in total
  taxSplit: jsonb("tax_split").$type<{ cgst: number; sgst: number; igst: number }>(),
  shippingAddress: jsonb("shipping_address").$type<Address>().notNull(),
  notes: text("notes"),
  carrier: text("carrier"),                    // manual | shiprocket | delhivery | <courier name>
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  shipmentRef: text("shipment_ref"),           // provider-side id
  shippedAt: timestamp("shipped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("orders_user").on(t.userId), index("orders_email").on(t.email)]);

export const orderItems = pgTable("order_items", {
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productHandle: text("product_handle").notNull(),
  title: text("title").notNull(),
  image: text("image"),
  months: integer("months").notNull(),
  price: integer("price").notNull(),
  compareAt: integer("compare_at").notNull().default(0),
  qty: integer("qty").notNull(),
  taxRate: integer("tax_rate").notNull().default(0),       // % at time of order
  hsn: text("hsn"),
}, (t) => [primaryKey({ columns: [t.orderId, t.productHandle, t.months] })]);

// ── Discounts & settings ────────────────────────────────────────
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),            // stored uppercase
  type: discountType("type").notNull(),
  value: integer("value").notNull().default(0),     // percent (1-100) or ₹ amount
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxDiscount: integer("max_discount"),             // cap for percent codes
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  usageLimit: integer("usage_limit"),               // total uses, null = unlimited
  usedCount: integer("used_count").notNull().default(0),
  oncePerCustomer: boolean("once_per_customer").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// ── Reviews ─────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productHandle: text("product_handle").notNull().references(() => products.handle, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),           // 1-5
  title: text("title"),
  body: text("body").notNull(),
  verified: boolean("verified").notNull().default(false),
  status: reviewStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("reviews_product").on(t.productHandle, t.status)]);

// ── Content ─────────────────────────────────────────────────────
export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(),               // e.g. about, faq, policies/refund, clinic/joint
  title: text("title").notNull(),
  body: text("body").notNull().default(""),     // sanitised HTML
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),     // sanitised HTML
  image: text("image"),
  author: text("author").notNull().default("Dr. Manu Bora"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  focusKeyword: text("focus_keyword"),           // SEO: the main search phrase this post targets
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(true),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Inbox: clinic bookings + contact ────────────────────────────
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  kind: enquiryKind("kind").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  service: text("service"),                      // clinic service
  preferredDate: text("preferred_date"),
  message: text("message").notNull().default(""),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Returns ─────────────────────────────────────────────────────
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details").notNull().default(""),
  status: returnStatus("status").notNull().default("requested"),
  refundAmount: integer("refund_amount"),
  staffNote: text("staff_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Abandoned checkouts ─────────────────────────────────────────
export const checkoutDrafts = pgTable("checkout_drafts", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),       // in the recovery link
  email: text("email").notNull(),
  phone: text("phone"),
  name: text("name"),
  lines: jsonb("lines").$type<{ handle: string; title: string; months: number; qty: number; price: number; image?: string }[]>().notNull(),
  subtotal: integer("subtotal").notNull(),
  recoveredOrderId: integer("recovered_order_id"),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Programme slots (admin-defined batches with a seat cap) ─────
export const programSlots = pgTable("program_slots", {
  id: serial("id").primaryKey(),
  programSlug: text("program_slug").notNull(),
  label: text("label").notNull(),                      // "December 2026 · Gurugram"
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  capacity: integer("capacity").notNull(),
  confirmedCount: integer("confirmed_count").notNull().default(0),   // seats locked by a paid deposit
  balanceDueDays: integer("balance_due_days").notNull().default(14), // days after the deposit to clear the balance
  status: text("status").notNull().default("open"),    // open | closed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("slots_program").on(t.programSlug, t.status)]);

// ── Applications (fellowship / course enrolment) ────────────────
export const applicationStatus = pgEnum("application_status", ["new", "reviewing", "accepted", "rejected", "paid", "enrolled", "withdrawn"]);

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),           // AC-1001
  programSlug: text("program_slug").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull().default("India"),
  qualification: text("qualification").notNull(),     // MS Ortho, DNB, BPT, MPT…
  institution: text("institution"),                   // current hospital / college
  experienceYears: integer("experience_years"),
  preferredStart: text("preferred_start"),            // e.g. "2026-12"
  cvLink: text("cv_link"),                            // Drive / Dropbox link
  message: text("message").notNull().default(""),
  status: applicationStatus("status").notNull().default("new"),
  feeAmount: integer("fee_amount"),                   // set on acceptance (INR, excl. GST)
  gstRate: integer("gst_rate").notNull().default(18),
  feeIncludesGst: boolean("fee_includes_gst").notNull().default(false), // true = feeAmount is the GST-inclusive total
  payNow: integer("pay_now"),                         // amount due via link (deposit or full, incl. GST)
  paymentToken: text("payment_token").unique(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cohort: text("cohort"),                             // assigned batch, e.g. "Dec 2026" (auto-filled from the slot, if one is picked)
  slotId: integer("slot_id").references(() => programSlots.id, { onDelete: "set null" }),
  amountPaid: integer("amount_paid").notNull().default(0),           // cumulative INR received (deposit + balance)
  balanceDueAt: timestamp("balance_due_at", { withTimezone: true }), // deadline for the remaining balance; past this the seat auto-releases
  staffNote: text("staff_note"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("applications_email").on(t.email), index("applications_status").on(t.status)]);

// ── One row per captured programme payment = one GST invoice ──
export const applicationPayments = pgTable("application_payments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  invoiceNo: text("invoice_no").notNull().unique(),       // AC/2026-27/0001
  paymentId: text("payment_id").notNull().unique(),       // Razorpay (or test_) payment id; unique = idempotent
  kind: text("kind").notNull(),                           // full | deposit | balance
  amount: integer("amount").notNull(),                    // INR received, incl. GST
  taxable: integer("taxable").notNull(),                  // amount excl. GST
  gst: integer("gst").notNull(),
  gstRate: integer("gst_rate").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("application_payments_app").on(t.applicationId)]);

// ── Programmes (editable in Admin → Programmes; seeded from src/lib/programs.ts) ──
export const programs = pgTable("programs", {
  slug: text("slug").primaryKey(),
  data: jsonb("data").$type<import("@/lib/programs").Program>().notNull(),
  position: integer("position").notNull().default(0),
  published: boolean("published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Outgoing email log (Admin → Emails) ──
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  provider: text("provider").notNull(),          // smtp | resend | dev
  status: text("status").notNull(),              // sent | failed | logged
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
