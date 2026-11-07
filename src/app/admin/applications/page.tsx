import { STATUS_BADGE } from "@/lib/application-status";
import Link from "next/link";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, dateTime } from "@/components/admin/ui";
import { getProgram } from "@/lib/programs";

export const metadata = { title: "Applications" };

export default async function Applications({ searchParams }: PageProps<"/admin/applications">) {
  await connection();
  await requireStaff("support");
  const sp = await searchParams;
  const f = typeof sp.status === "string" ? sp.status : "";
  const d = await db();
  const base = d.select().from(schema.applications);
  const rows = await (f ? base.where(eq(schema.applications.status, f as "new")) : base).orderBy(desc(schema.applications.createdAt)).limit(300);
  const all = await d.select({ s: schema.applications.status }).from(schema.applications);
  const count = (s: string) => all.filter((x) => x.s === s).length;
  return (
    <>
      <PageHeader title="Applications" sub={`${count("new")} new · ${count("accepted")} awaiting payment · ${count("paid") + count("enrolled")} confirmed`} />
      <div className="mb-3 flex flex-wrap gap-1">
        {["", "new", "reviewing", "accepted", "paid", "enrolled", "rejected"].map((s) => (
          <Link key={s || "all"} href={s ? `/admin/applications?status=${s}` : "/admin/applications"} className={`rounded-lg px-3 py-1.5 text-[13px] capitalize ${f === s ? "bg-[#ebebeb] font-semibold" : "text-[#4a4a4a]"}`}>{s || "All"}{s ? ` ${count(s)}` : ""}</Link>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="text-left text-[12px] text-grey"><tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Application</th><th className="px-4 py-2 font-medium">Candidate</th><th className="px-4 py-2 font-medium">Program</th><th className="px-4 py-2 font-medium">Background</th><th className="px-4 py-2 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5"><Link href={`/admin/applications/${a.number}`} className="font-semibold hover:underline">{a.number}</Link><p className="text-[12px] text-grey">{dateTime(a.createdAt)}</p></td>
                  <td className="px-4 py-2.5"><p className="font-medium">{a.name}</p><p className="text-[12px] text-grey">{a.email} · {a.country}</p></td>
                  <td className="px-4 py-2.5">{getProgram(a.programSlug)?.title ?? a.programSlug}</td>
                  <td className="px-4 py-2.5 text-grey">{a.qualification}{a.experienceYears !== null ? ` · ${a.experienceYears} yrs` : ""}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-grey">No applications yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
