import Link from "next/link";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, dateTime, inr } from "@/components/admin/ui";
import { ReturnDecision } from "@/components/admin/small-actions";

export const metadata = { title: "Returns" };
const BADGE: Record<string, string> = { requested: "bg-[#fff1d6] text-[#5e4200]", approved: "bg-[#e0f0ff] text-[#00376b]", rejected: "bg-[#ebebeb]", refunded: "bg-[#cdfee1] text-[#0c5132]" };

export default async function Returns() {
  await connection();
  await requireStaff("support");
  const rows = await (await db()).select({ r: schema.returns, o: schema.orders }).from(schema.returns).innerJoin(schema.orders, eq(schema.orders.id, schema.returns.orderId)).orderBy(desc(schema.returns.createdAt)).limit(300);
  return (
    <>
      <PageHeader title="Returns" sub={`${rows.filter((x) => x.r.status === "requested").length} awaiting review`} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map(({ r, o }) => (
            <li key={r.id} className="px-4 py-4 text-[13px]">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/orders/${o.number}`} className="font-semibold hover:underline">{o.number}</Link>
                <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${BADGE[r.status]}`}>{r.status}</span>
                <span className="text-grey">{o.shippingAddress.name} · {o.email} · {inr(o.total)} · {dateTime(r.createdAt)}</span>
              </div>
              <p className="mt-1 font-medium">{r.reason}</p>
              {r.details && <p className="text-[#303030]">{r.details}</p>}
              {r.refundAmount !== null && <p className="text-ok">Refunded {inr(r.refundAmount)}</p>}
              {r.staffNote && <p className="text-grey">Note: {r.staffNote}</p>}
              <ReturnDecision id={r.id} status={r.status} total={o.total} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-grey">No return requests.</li>}
        </ul>
      </Card>
    </>
  );
}
