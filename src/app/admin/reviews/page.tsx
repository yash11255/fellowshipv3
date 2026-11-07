import Link from "next/link";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, dateTime } from "@/components/admin/ui";
import { Stars } from "@/components/reviews/stars";
import { ReviewActions } from "@/components/admin/review-row-actions";

export const metadata = { title: "Reviews" };

export default async function Reviews() {
  await connection();
  await requireStaff();
  const rows = await (await db()).select({ r: schema.reviews, title: schema.products.title }).from(schema.reviews)
    .innerJoin(schema.products, eq(schema.products.handle, schema.reviews.productHandle)).orderBy(desc(schema.reviews.createdAt)).limit(300);
  const pending = rows.filter((x) => x.r.status === "pending").length;
  const badge = { pending: "bg-[#fff1d6] text-[#5e4200]", approved: "bg-[#cdfee1] text-[#0c5132]", rejected: "bg-[#ebebeb] text-[#4a4a4a]" } as const;
  return (
    <>
      <PageHeader title="Reviews" sub={`${pending} awaiting moderation`} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map(({ r, title }) => (
            <li key={r.id} className="flex flex-wrap items-start gap-4 px-4 py-4 text-[13px]">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${badge[r.status]}`}>{r.status}</span>
                  {r.verified && <span className="text-[12px] text-ok">✓ Verified buyer</span>}
                  <span className="text-grey">{r.name} · {dateTime(r.createdAt)}</span>
                </div>
                <Link href={`/products/${r.productHandle}#reviews`} target="_blank" className="mt-1 block font-medium hover:underline">{title}</Link>
                {r.title && <p className="mt-1 font-semibold">{r.title}</p>}
                <p className="mt-0.5 text-[#303030]">{r.body}</p>
              </div>
              <ReviewActions id={r.id} status={r.status} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-grey">No reviews yet.</li>}
        </ul>
      </Card>
    </>
  );
}
