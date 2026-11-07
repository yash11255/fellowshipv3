import Link from "next/link";
import { connection } from "next/server";
import { desc, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { Card, PageHeader, dateTime, inr } from "@/components/admin/ui";
import { requireStaff } from "@/lib/admin";
import { getAllPrograms } from "@/lib/program-store";
import { STATUS_BADGE } from "@/lib/application-status";

export const metadata = { title: "Dashboard" };
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export default async function Dashboard() {
  await connection();
  await requireStaff();
  const d = await db();
  const apps = await d.select().from(schema.applications).orderBy(desc(schema.applications.createdAt));
  const since = daysAgo(30);
  const recent = apps.filter((a) => a.createdAt >= since);
  const collected = apps.filter((a) => a.paidAt && a.paidAt >= since).reduce((s, a) => s + (a.payNow ?? 0), 0);
  const enquiries = await d.select().from(schema.enquiries).where(gte(schema.enquiries.createdAt, since)).orderBy(desc(schema.enquiries.createdAt));
  const open = enquiries.filter((e) => !e.handled);
  const n = (s: string) => apps.filter((a) => a.status === s).length;

  const tiles = [
    ["New applications", String(n("new")), "Waiting for review", "/admin/applications?status=new"],
    ["Accepted, unpaid", String(n("accepted")), "Payment link sent", "/admin/applications?status=accepted"],
    ["Fees collected", inr(collected), "Last 30 days", "/admin/applications?status=paid"],
    ["Open enquiries", String(open.length), "Contact form, last 30 days", "/admin/inbox"],
  ];
  const all = await getAllPrograms();
  const byProgram = all.map((p) => ({ p, count: recent.filter((a) => a.programSlug === p.slug).length }));
  const max = Math.max(1, ...byProgram.map((b) => b.count));

  return (
    <>
      <PageHeader title="Dashboard" sub="Admissions at a glance" actions={<Link href="/admin/export/applications" className="rounded-md border border-[#d4d4d4] bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-[#f6f6f6]">Export applications (CSV)</Link>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map(([k, v, s, href]) => (
          <Link key={k} href={href}><Card className="p-4 transition-shadow hover:shadow-md">
            <p className="text-[13px] text-grey">{k}</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{v}</p>
            <p className="text-[12px] text-mute">{s}</p>
          </Card></Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Latest applications" className="xl:col-span-2" action={<Link href="/admin/applications" className="text-[13px] text-[#005bd3] hover:underline">View all</Link>}>
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-[#f0f0f0]">
              {apps.slice(0, 8).map((a) => (
                <tr key={a.id} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5 font-semibold"><Link href={`/admin/applications/${a.number}`} className="hover:underline">{a.number}</Link></td>
                  <td className="px-4 py-2.5">{a.name}</td>
                  <td className="hidden px-4 py-2.5 text-grey md:table-cell">{all.find((p) => p.slug === a.programSlug)?.title ?? a.programSlug}</td>
                  <td className="hidden px-4 py-2.5 text-grey sm:table-cell">{dateTime(a.createdAt)}</td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_BADGE[a.status]}`}>{a.status}</span></td>
                </tr>
              ))}
              {apps.length === 0 && <tr><td className="p-4 text-grey">No applications yet. They appear here as soon as someone applies on /apply.</td></tr>}
            </tbody>
          </table>
        </Card>
        <Card title="Applications by programme" action={<span className="text-[12px] text-grey">Last 30 days</span>}>
          <ul className="space-y-3 p-4">
            {byProgram.map(({ p, count }) => (
              <li key={p.slug} className="text-[13px]">
                <div className="flex justify-between gap-3"><span className="truncate">{p.title}</span><span className="font-semibold">{count}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-[#f0f0f0]"><div className="h-full rounded-full bg-[#192136]" style={{ width: `${(count / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Recent enquiries" className="mt-4" action={<Link href="/admin/inbox" className="text-[13px] text-[#005bd3] hover:underline">Open inbox</Link>}>
        <ul className="divide-y divide-[#f0f0f0]">
          {enquiries.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-[13px]">
              <span className="min-w-0 truncate"><span className="font-semibold">{e.name}</span> <span className="text-grey">· {e.message.slice(0, 80)}</span></span>
              <span className={`shrink-0 text-[12px] ${e.handled ? "text-grey" : "font-semibold text-[#8a5a00]"}`}>{e.handled ? "Handled" : "Open"}</span>
            </li>
          ))}
          {enquiries.length === 0 && <li className="p-4 text-[13px] text-grey">No enquiries in the last 30 days.</li>}
        </ul>
      </Card>
    </>
  );
}
