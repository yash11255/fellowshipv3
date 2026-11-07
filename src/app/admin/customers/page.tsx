import Link from "next/link";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, PageHeader, shortDate } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin";
import { PROGRAMS } from "@/lib/programs";

export const metadata = { title: "Students" };

/** Everyone who has applied, grouped by email: their programmes and furthest stage reached. */
export default async function Students({ searchParams }: PageProps<"/admin/customers">) {
  await connection();
  await requireStaff("support");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.toLowerCase().trim() : "";
  const apps = await (await db()).select().from(schema.applications).orderBy(desc(schema.applications.createdAt));
  const by = new Map<string, typeof apps>();
  for (const a of apps) by.set(a.email, [...(by.get(a.email) ?? []), a]);
  const rows = [...by].filter(([e, l]) => !q || e.includes(q) || l[0].name.toLowerCase().includes(q) || l[0].phone.includes(q));
  const title = (s: string) => PROGRAMS.find((p) => p.slug === s)?.title ?? s;
  return (
    <>
      <PageHeader title="Students" sub={`${by.size} people have applied`} actions={<Link href="/admin/export/applications" className="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-[#f6f6f6]">Export CSV</Link>} />
      <form className="mb-3"><input name="q" defaultValue={q} placeholder="Search name, email or phone" className="h-9 w-full max-w-sm rounded-md border border-[#d4d4d4] bg-white px-3 text-[13px]" /></form>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="text-left text-grey"><tr className="border-b border-[#f0f0f0]"><th className="px-4 py-2 font-medium">Name</th><th className="px-4 py-2 font-medium">Contact</th><th className="px-4 py-2 font-medium">Programmes</th><th className="px-4 py-2 font-medium">Enrolled</th><th className="px-4 py-2 font-medium">Last applied</th></tr></thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {rows.map(([email, l]) => (
                <tr key={email} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5 font-semibold">{l[0].name}<span className="block font-normal text-grey">{l[0].qualification}</span></td>
                  <td className="px-4 py-2.5">{email}<span className="block text-grey">{l[0].phone} · {l[0].country}</span></td>
                  <td className="px-4 py-2.5">{l.map((a) => <Link key={a.id} href={`/admin/applications/${a.number}`} className="block text-[#005bd3] hover:underline">{title(a.programSlug)} <span className="capitalize text-grey">({a.status})</span></Link>)}</td>
                  <td className="px-4 py-2.5">{l.some((a) => a.status === "paid" || a.status === "enrolled") ? "Yes" : "No"}</td>
                  <td className="px-4 py-2.5 text-grey">{shortDate(l[0].createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-grey">No students yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
