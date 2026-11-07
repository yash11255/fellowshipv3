import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { requireStaff } from "@/lib/admin";
import { getAllPrograms } from "@/lib/program-store";
import { inr } from "@/lib/programs";
import { Card, PageHeader } from "@/components/admin/ui";
import { ProgramRowActions } from "@/components/admin/program-row-actions";

export const metadata = { title: "Programmes" };

export default async function Programs() {
  await connection();
  await requireStaff("manager");
  const rows = await getAllPrograms();
  return (
    <>
      <PageHeader title="Programmes" sub="Courses shown on the site: fees, dates, curriculum, photos" actions={<Link href="/admin/programs/edit" className="inline-flex h-8 items-center rounded-lg bg-[#303030] px-3 text-[13px] font-medium text-white">New programme</Link>} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map((p, i) => (
            <li key={p.slug} className="flex flex-wrap items-center gap-4 px-4 py-3 text-[13px]">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-[#f0f0f0]"><Image src={p.image} alt="" fill sizes="64px" className="object-cover" /></div>
              <Link href={`/admin/programs/edit?slug=${encodeURIComponent(p.slug)}`} className="min-w-0 flex-1 hover:underline">
                <span className="block truncate text-[14px] font-semibold">{p.title}</span>
                <span className="text-grey">{p.duration} · {p.fee[0] ? `${inr(p.fee[0].amount)} ${p.fee[0].note ?? ""}` : "Fee on request"}{p.nextDates?.length ? ` · next: ${p.nextDates[0]}` : ""}</span>
              </Link>
              {p.confirm && <span className="hidden max-w-[240px] truncate rounded bg-[#fff1d6] px-2 py-0.5 text-[12px] text-[#5e4200] lg:inline" title={p.confirm}>Note: {p.confirm}</span>}
              <span className={`rounded-full px-2 py-0.5 text-[12px] ${p.published ? "bg-[#cdfee1] text-[#0c5132]" : "bg-[#ebebeb]"}`}>{p.published ? "Visible" : "Hidden"}</span>
              <ProgramRowActions slug={p.slug} published={p.published} first={i === 0} last={i === rows.length - 1} />
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-3 text-[12px] text-grey">Order here is the order on the site. Changes go live immediately.</p>
    </>
  );
}
