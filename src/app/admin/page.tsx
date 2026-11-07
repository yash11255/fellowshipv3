import Link from "next/link";
import { connection } from "next/server";
import { and, desc, gte, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, PageHeader, StatusBadge, dateTime, inr } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requireStaff } from "@/lib/admin";

export const metadata = { title: "Dashboard" };

/** Midnight at the start of an N-day window ending today (server time). */
function windowStart(days: number) {
  const d = new Date(Date.now() - (days - 1) * 86_400_000);
  d.setHours(0, 0, 0, 0);
  return d;
}

const COUNTED = ["confirmed", "paid", "shipped", "delivered"] as const;

export default async function Dashboard() {
  await connection();
  await requireStaff();
  const d = await db();
  const since = windowStart(14);

  const recent = await d.select().from(schema.orders).where(gte(schema.orders.createdAt, since));
  const counted = recent.filter((o) => (COUNTED as readonly string[]).includes(o.status));
  const revenue = counted.reduce((s, o) => s + o.total, 0);
  const aov = counted.length ? Math.round(revenue / counted.length) : 0;
  const toFulfil = await d.select({ n: sql<number>`count(*)::int` }).from(schema.orders).where(inArray(schema.orders.status, ["confirmed", "paid"]));

  const days = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(since.getTime() + i * 86_400_000);
    const key = day.toDateString();
    const os = counted.filter((o) => o.createdAt.toDateString() === key);
    return { label: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), value: os.reduce((s, o) => s + o.total, 0), orders: os.length };
  });

  const latest = await d.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(6);
  const top = await d.select({ title: schema.orderItems.title, qty: sql<number>`sum(${schema.orderItems.qty})::int`, rev: sql<number>`sum(${schema.orderItems.qty} * ${schema.orderItems.price})::int` })
    .from(schema.orderItems).innerJoin(schema.orders, sql`${schema.orders.id} = ${schema.orderItems.orderId}`)
    .where(and(ne(schema.orders.status, "cancelled"), gte(schema.orders.createdAt, since)))
    .groupBy(schema.orderItems.title).orderBy(sql`2 desc`).limit(5);
  const soldOut = await d.select({ handle: schema.products.handle, title: schema.products.title }).from(schema.products)
    .where(sql`${schema.products.status} = 'active' and not exists (select 1 from variants v where v.product_handle = ${schema.products.handle} and v.available and (v.stock is null or v.stock > 0))`);

  const tiles = [
    ["Revenue", inr(revenue), "Last 14 days"],
    ["Orders", String(counted.length), "Last 14 days"],
    ["Avg. order value", inr(aov), "Last 14 days"],
    ["To fulfil", String(toFulfil[0].n), "Confirmed or paid, not shipped"],
  ];

  return (
    <>
      <PageHeader title="Dashboard" sub="Overview of the last 14 days" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(([k, v, s]) => (
          <Card key={k} className="p-4">
            <p className="text-[13px] text-grey">{k}</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{v}</p>
            <p className="text-[12px] text-mute">{s}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Daily revenue" className="xl:col-span-2"><RevenueChart days={days} /></Card>
        <Card title="Top products" action={<span className="text-[12px] text-grey">Units · revenue</span>}>
          {top.length === 0 ? <p className="p-4 text-[13px] text-grey">No sales yet.</p> : (
            <ul className="divide-y divide-[#f0f0f0]">
              {top.map((t) => (
                <li key={t.title} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                  <span className="truncate">{t.title}</span><span className="shrink-0 text-grey">{t.qty} · {inr(t.rev)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Recent orders" className="xl:col-span-2" action={<Link href="/admin/orders" className="text-[13px] text-[#005bd3] hover:underline">View all</Link>}>
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-[#f0f0f0]">
              {latest.map((o) => (
                <tr key={o.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5 font-semibold"><Link href={`/admin/orders/${o.number}`} className="hover:underline">{o.number}</Link></td>
                  <td className="px-4 py-2.5 text-grey">{dateTime(o.createdAt)}</td>
                  <td className="hidden px-4 py-2.5 md:table-cell">{o.shippingAddress.name}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-2.5 text-right">{inr(o.total)}</td>
                </tr>
              ))}
              {latest.length === 0 && <tr><td className="p-4 text-grey">No orders yet.</td></tr>}
            </tbody>
          </table>
        </Card>
        <Card title={`Sold out (${soldOut.length})`}>
          <ul className="divide-y divide-[#f0f0f0]">
            {soldOut.map((p) => (
              <li key={p.handle}><Link href={`/admin/products/${p.handle}`} className="flex justify-between px-4 py-2.5 text-[13px] hover:bg-[#fafafa]"><span className="truncate">{p.title}</span><span className="text-[#005bd3]">Edit</span></Link></li>
            ))}
            {soldOut.length === 0 && <li className="p-4 text-[13px] text-grey">Everything is in stock.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
