import Link from "next/link";
import { Suspense } from "react";
import clsx from "clsx";
import { and, desc, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, StatusBadge, dateTime, inr, input, ExportLink } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

const TABS = [
  { key: "all", label: "All", statuses: undefined },
  { key: "unfulfilled", label: "Unfulfilled", statuses: ["confirmed", "paid"] as const },
  { key: "pending", label: "Awaiting payment", statuses: ["pending_payment"] as const },
  { key: "shipped", label: "Shipped", statuses: ["shipped"] as const },
  { key: "closed", label: "Delivered / closed", statuses: ["delivered", "cancelled", "refunded"] as const },
];

async function List({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const conds: SQL[] = [];
  if (tab.statuses) conds.push(inArray(schema.orders.status, [...tab.statuses]));
  if (q) conds.push(or(ilike(schema.orders.number, `%${q}%`), ilike(schema.orders.email, `%${q}%`), ilike(schema.orders.phone, `%${q}%`))!);
  const d = await db();
  const rows = await d.select().from(schema.orders).where(and(...conds)).orderBy(desc(schema.orders.createdAt)).limit(200);
  const counts = Object.fromEntries(await Promise.all(TABS.filter((t) => t.statuses).map(async (t) => {
    const statuses = [...(t.statuses ?? [])];
    const r = await d.select({ id: schema.orders.id }).from(schema.orders).where(inArray(schema.orders.status, statuses));
    return [t.key, r.length];
  })));

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] px-3 py-2">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Order filters">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin/orders?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={clsx("shrink-0 rounded-lg px-3 py-1.5 text-[13px]", t.key === tab.key ? "bg-[#ebebeb] font-semibold" : "text-[#4a4a4a] hover:bg-[#f4f4f4]")}>
              {t.label}{counts[t.key] ? <span className="ml-1 text-grey">{counts[t.key]}</span> : null}
            </Link>
          ))}
        </nav>
        <form className="w-full sm:w-64"><input type="hidden" name="tab" value={tab.key} /><input name="q" defaultValue={q} placeholder="Search order, email, phone" className={input} /></form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead className="text-left text-[12px] text-grey">
            <tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Order</th><th className="px-4 py-2 font-medium">Date</th><th className="px-4 py-2 font-medium">Customer</th><th className="px-4 py-2 font-medium">Payment</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-[#fafafa]">
                <td className="px-4 py-2.5 font-semibold"><Link href={`/admin/orders/${o.number}`} className="hover:underline">{o.number}</Link></td>
                <td className="px-4 py-2.5 text-grey">{dateTime(o.createdAt)}</td>
                <td className="px-4 py-2.5"><p>{o.shippingAddress.name}</p><p className="text-[12px] text-grey">{o.email}</p></td>
                <td className="px-4 py-2.5">{o.paymentMethod === "cod" ? "COD" : "Razorpay"}</td>
                <td className="px-4 py-2.5"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-2.5 text-right font-medium">{inr(o.total)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-grey">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Page({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" actions={<ExportLink type="orders" />} />
      <Suspense fallback={<Card><div className="h-64" aria-busy /></Card>}><List searchParams={searchParams} /></Suspense>
    </>
  );
}
