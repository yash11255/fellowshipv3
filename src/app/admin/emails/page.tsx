import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { emailProvider } from "@/lib/email";
import { Card, PageHeader, dateTime } from "@/components/admin/ui";
import { TestEmail } from "@/components/admin/test-email";

export const metadata = { title: "Emails" };
const LABEL = { smtp: "SMTP mail server", resend: "Resend", dev: "Not connected (development: emails are only logged here)" } as const;

export default async function Emails() {
  await connection();
  const user = await requireStaff("manager");
  const rows = await (await db()).select().from(schema.emailLog).orderBy(desc(schema.emailLog.createdAt)).limit(200);
  const p = emailProvider();
  return (
    <>
      <PageHeader title="Emails" sub="Every confirmation and notification the site sends" />
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-grey">Mail server</p>
            <p className={`text-[15px] font-semibold ${p === "dev" ? "text-[#8a5a00]" : "text-[#0c5132]"}`}>{LABEL[p]}{p === "smtp" ? ` · ${process.env.SMTP_HOST}` : ""}</p>
            <p className="mt-1 text-[12px] text-grey">Sender: {process.env.EMAIL_FROM ?? "Arthroscopy College <admissions@arthroscopycollege.com>"}. Set SMTP_HOST / SMTP_USER / SMTP_PASS (or RESEND_API_KEY) in the server environment.</p>
          </div>
          <TestEmail defaultTo={user.email} />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="text-left text-grey"><tr className="border-b border-[#f0f0f0]"><th className="px-4 py-2 font-medium">When</th><th className="px-4 py-2 font-medium">To</th><th className="px-4 py-2 font-medium">Subject</th><th className="px-4 py-2 font-medium">Status</th></tr></thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-[#fafafa]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-grey">{dateTime(r.createdAt)}</td>
                  <td className="px-4 py-2.5">{r.to}</td>
                  <td className="px-4 py-2.5"><details><summary className="cursor-pointer font-medium">{r.subject}</summary><pre className="mt-2 whitespace-pre-wrap font-sans text-[12px] text-grey">{r.body}</pre></details></td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${r.status === "sent" ? "bg-[#cdfee1] text-[#0c5132]" : r.status === "failed" ? "bg-[#fee3e1] text-[#8e1f0b]" : "bg-[#ebebeb]"}`} title={r.error ?? undefined}>{r.status}</span>{r.error && <span className="mt-1 block max-w-[220px] text-[11px] text-sale">{r.error}</span>}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-grey">No emails yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
