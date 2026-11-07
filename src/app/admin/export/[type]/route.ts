import { asc, desc } from "drizzle-orm";
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

  if (type === "orders") {
    const rows = await d.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    body = csv(["Order", "Date", "Status", "Payment", "Email", "Phone", "Name", "City", "State", "Pincode", "Subtotal", "Discount", "Code", "Shipping", "COD fee", "GST", "CGST", "SGST", "IGST", "Total", "Carrier", "AWB"],
      rows.map((o) => [o.number, o.createdAt, o.status, o.paymentMethod, o.email, o.phone, o.shippingAddress.name, o.shippingAddress.city, o.shippingAddress.state, o.shippingAddress.pincode,
        o.subtotal, o.discount, o.discountCode, o.shipping, o.codFee, o.taxTotal, o.taxSplit?.cgst ?? 0, o.taxSplit?.sgst ?? 0, o.taxSplit?.igst ?? 0, o.total, o.carrier, o.trackingNumber]));
  } else if (type === "customers") {
    const rows = await d.select().from(schema.orders).orderBy(asc(schema.orders.email));
    const by = new Map<string, { name: string; phone: string; city: string; orders: number; spent: number; last: Date }>();
    for (const o of rows) {
      const c = by.get(o.email) ?? { name: o.shippingAddress.name, phone: o.phone, city: o.shippingAddress.city, orders: 0, spent: 0, last: o.createdAt };
      c.orders++; if (!["cancelled", "refunded", "pending_payment"].includes(o.status)) c.spent += o.total;
      if (o.createdAt > c.last) Object.assign(c, { last: o.createdAt, name: o.shippingAddress.name, city: o.shippingAddress.city });
      by.set(o.email, c);
    }
    body = csv(["Email", "Name", "Phone", "City", "Orders", "Total spent", "Last order"], [...by].map(([e, c]) => [e, c.name, c.phone, c.city, c.orders, c.spent, c.last]));
  } else if (type === "products") {
    const ps = await d.select().from(schema.products).orderBy(asc(schema.products.title));
    const vs = await d.select().from(schema.variants);
    body = csv(["Handle", "Title", "Status", "Type", "GST slab", "HSN", "Supply (months)", "SKU", "Price", "Compare-at", "Selling", "Stock"],
      ps.flatMap((p) => vs.filter((v) => v.productHandle === p.handle).map((v) => [p.handle, p.title, p.status, p.kind, p.taxSlab, p.hsn, v.months, v.sku, v.price, v.compareAt, v.available ? "yes" : "no", v.stock ?? ""])));
  } else {
    return new Response("Not found", { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="reverse-${type}-${date}.csv"`, "Cache-Control": "no-store" } });
}
