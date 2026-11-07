import { connection } from "next/server";
import { desc, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, dateTime, inr } from "@/components/admin/ui";
import { RecoveryActions } from "@/components/admin/small-actions";

export const metadata = { title: "Abandoned checkouts" };

export default async function Abandoned() {
  await connection();
  await requireStaff("support");
  const rows = await (await db()).select().from(schema.checkoutDrafts).where(isNull(schema.checkoutDrafts.recoveredOrderId)).orderBy(desc(schema.checkoutDrafts.updatedAt)).limit(300);
  const base = process.env.SITE_URL ?? "http://localhost:3100";
  return (
    <>
      <PageHeader title="Abandoned checkouts" sub={`${rows.length} checkouts started with an email but not completed · ${inr(rows.reduce((s, r) => s + r.subtotal, 0))} in carts`} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-4 px-4 py-4 text-[13px]">
              <div className="min-w-0 flex-1">
                <p><span className="font-semibold">{r.name || r.email}</span> <span className="text-grey">{r.name ? r.email : ""} {r.phone ? `· ${r.phone}` : ""}</span></p>
                <p className="mt-1 text-[#303030]">{r.lines.map((l) => `${l.title} × ${l.qty}`).join(", ")}</p>
                <p className="mt-1 text-grey">{inr(r.subtotal)} · last active {dateTime(r.updatedAt)}{r.reminderSentAt ? ` · reminder sent ${dateTime(r.reminderSentAt)}` : ""}</p>
              </div>
              <RecoveryActions id={r.id} link={`${base}/checkout?recover=${r.token}`} sent={!!r.reminderSentAt} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-grey">No abandoned checkouts.</li>}
        </ul>
      </Card>
      <p className="mt-3 text-[12px] text-grey">A checkout is saved once the customer enters an email. It disappears from this list when they complete an order.</p>
    </>
  );
}
