import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";

const STAFF = new Set(["support", "content", "manager", "owner"]);

// Excel-safe CSV: quote everything, neutralise formula injection (=, +, -, @ at start).
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (header: string[], rows: unknown[][]) => "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");

export async function GET(_req: Request, ctx: RouteContext<"/admin/export/[type]">) {
  const user = await currentUser();
  if (!user || !STAFF.has(user.role)) return new Response("Not found", { status: 404 });
  const { type } = await ctx.params;
  const d = await db();
  let body: string;
  if (type === "applications") {
    const rows = await d.select().from(schema.applications).orderBy(desc(schema.applications.createdAt));
    body = csv(["Number", "Date", "Status", "Programme", "Name", "Email", "Phone", "Country", "Qualification", "Institution", "Experience (yrs)", "Preferred start", "Cohort", "Fee", "Payable now", "Paid at", "Razorpay payment"],
      rows.map((a) => [a.number, a.createdAt, a.status, a.programSlug, a.name, a.email, a.phone, a.country, a.qualification, a.institution, a.experienceYears, a.preferredStart, a.cohort, a.feeAmount, a.payNow, a.paidAt, a.razorpayPaymentId]));
  } else if (type === "enquiries") {
    const rows = await d.select().from(schema.enquiries).orderBy(desc(schema.enquiries.createdAt));
    body = csv(["Date", "Type", "Name", "Email", "Phone", "Topic", "Message", "Handled"], rows.map((e) => [e.createdAt, e.kind, e.name, e.email, e.phone, e.service, e.message, e.handled]));
  } else return new Response("Not found", { status: 404 });
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
