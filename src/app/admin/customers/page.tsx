import { connection } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, inr, shortDate, ExportLink } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default async function Customers() {
  await connection();
  await requireStaff();
  const d = await db();
  // customers = everyone who ordered (incl. guests) + registered users, grouped by email
  const rows = await d.select({
    email: schema.orders.email,
    name: sql<string>`(array_agg(${schema.orders.shippingAddress}->>'name' order by ${schema.orders.createdAt} desc))[1]`,
    city: sql<string>`(array_agg(${schema.orders.shippingAddress}->>'city' order by ${schema.orders.createdAt} desc))[1]`,
    orders: sql<number>`count(*)::int`,
    spent: sql<number>`coalesce(sum(${schema.orders.total}) filter (where ${schema.orders.status} not in ('cancelled','refunded','pending_payment')), 0)::int`,
    last: sql<Date>`max(${schema.orders.createdAt})`,
    registered: sql<boolean>`bool_or(${schema.orders.userId} is not null)`,
  }).from(schema.orders).groupBy(schema.orders.email).orderBy(desc(sql`max(${schema.orders.createdAt})`)).limit(500);

  return (
    <>
      <PageHeader title="Customers" sub={`${rows.length} customers with orders`} actions={<ExportLink type="customers" />} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="text-left text-[12px] text-grey">
              <tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Customer</th><th className="px-4 py-2 font-medium">Location</th><th className="px-4 py-2 font-medium">Orders</th><th className="px-4 py-2 font-medium">Last order</th><th className="px-4 py-2 text-right font-medium">Spent</th></tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {rows.map((r) => (
                <tr key={r.email} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5"><p className="font-medium">{r.name}</p><p className="text-[12px] text-grey">{r.email}{r.registered ? " · Account" : " · Guest"}</p></td>
                  <td className="px-4 py-2.5 text-grey">{r.city}</td>
                  <td className="px-4 py-2.5">{r.orders}</td>
                  <td className="px-4 py-2.5 text-grey">{shortDate(new Date(r.last))}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{inr(r.spent)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-grey">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
