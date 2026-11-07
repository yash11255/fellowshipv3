import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { getTax } from "@/lib/settings";
import { TaxManager } from "@/components/admin/tax-manager";

export const metadata = { title: "Taxes" };

export default async function Taxes() {
  await connection();
  await requireStaff("owner");
  const tax = await getTax();
  const rows = await (await db()).select({ slab: schema.products.taxSlab, n: sql<number>`count(*)::int` }).from(schema.products).groupBy(schema.products.taxSlab);
  return <TaxManager initial={tax} usage={Object.fromEntries(rows.map((r) => [r.slab, r.n]))} />;
}
