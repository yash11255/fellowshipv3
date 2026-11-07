import { connection } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, dateTime } from "@/components/admin/ui";
import { HandledToggle } from "@/components/admin/small-actions";

export const metadata = { title: "Inbox" };

export default async function Inbox() {
  await connection();
  await requireStaff("support");
  const rows = await (await db()).select().from(schema.enquiries).orderBy(asc(schema.enquiries.handled), desc(schema.enquiries.createdAt)).limit(300);
  const open = rows.filter((r) => !r.handled).length;
  return (
    <>
      <PageHeader title="Enquiries" sub={`${open} open · messages from the contact form`} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-start gap-4 px-4 py-4 text-[13px] ${r.handled ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${r.kind === "clinic" ? "bg-[#e0f0ff] text-[#00376b]" : "bg-[#ebebeb]"}`}>{r.kind === "clinic" ? "Consultation" : "Contact"}</span>
                  <span className="font-semibold">{r.name}</span><span className="text-grey">{dateTime(r.createdAt)}</span>
                </div>
                <p className="mt-1"><a href={`mailto:${r.email}`} className="text-[#005bd3] hover:underline">{r.email}</a>{r.phone && <> · <a href={`tel:${r.phone}`} className="text-[#005bd3] hover:underline">{r.phone}</a></>}</p>
                {(r.service || r.preferredDate) && <p className="mt-1 text-grey">{r.service ?? "General"}{r.preferredDate ? ` · preferred ${r.preferredDate}` : ""}</p>}
                {r.message && <p className="mt-2 whitespace-pre-line text-[#303030]">{r.message}</p>}
              </div>
              <HandledToggle id={r.id} handled={r.handled} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-grey">No messages yet.</li>}
        </ul>
      </Card>
    </>
  );
}
