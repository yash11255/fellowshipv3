import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { DiscountsManager } from "@/components/admin/discount-form";

export const metadata = { title: "Discounts" };
const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : null);

export default async function Discounts() {
  await connection();
  await requireStaff();
  const rows = await (await db()).select().from(schema.discounts).orderBy(desc(schema.discounts.createdAt));
  return (
    <>
      <PageHeader title="Discounts" sub="Codes customers enter at checkout" />
      <DiscountsManager rows={rows.map((r) => ({ ...r, startsAt: local(r.startsAt), endsAt: local(r.endsAt) }))} />
    </>
  );
}
