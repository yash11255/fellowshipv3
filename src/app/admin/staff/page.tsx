import { connection } from "next/server";
import { asc, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { PageHeader } from "@/components/admin/ui";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata = { title: "Staff" };

export default async function Staff() {
  await connection();
  const me = await requireStaff("owner");
  const rows = await (await db()).select().from(schema.users).where(ne(schema.users.role, "customer")).orderBy(asc(schema.users.email));
  return (
    <>
      <PageHeader title="Staff" sub="Who can access the admin" />
      <StaffManager me={me.email} staff={rows.map((r) => ({ email: r.email, role: r.role, createdAt: r.createdAt.toISOString() }))} />
    </>
  );
}
