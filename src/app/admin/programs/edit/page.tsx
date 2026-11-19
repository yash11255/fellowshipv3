import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin";
import { getProgramBySlug } from "@/lib/program-store";
import { getAllSlots } from "@/lib/slots";
import type { Program } from "@/lib/programs";
import { ProgramEditor } from "@/components/admin/program-editor";
import type { SlotDTO } from "@/components/admin/slot-manager";

export const metadata = { title: "Edit programme" };

const BLANK: Program = { slug: "", title: "", short: "", audience: "", duration: "", format: "Offline · Gurugram", fee: [], image: "/img/ot-1.webp", highlights: [], curriculum: [{ title: "", items: [] }], outcomes: [], eligibility: [] };

export default async function EditProgram({ searchParams }: PageProps<"/admin/programs/edit">) {
  await connection();
  await requireStaff("manager");
  const sp = await searchParams;
  const slug = typeof sp.slug === "string" ? sp.slug : null;
  const row = slug ? await getProgramBySlug(slug) : null;
  if (slug && !row) notFound();
  const { published = true, position: _pos, ...data } = row ?? { ...BLANK, published: false, position: 0 };
  void _pos;
  const slots: SlotDTO[] = row ? (await getAllSlots(row.slug)).map((s) => ({
    id: s.id, label: s.label, startDate: s.startDate.toISOString(), endDate: s.endDate ? s.endDate.toISOString() : null,
    capacity: s.capacity, confirmedCount: s.confirmedCount, balanceDueDays: s.balanceDueDays, status: s.status,
  })) : [];
  return (
    <>
      <Link href="/admin/programs" className="text-[13px] text-grey hover:text-black">← Programmes</Link>
      <h1 className="mb-4 mt-2 text-[22px] font-semibold tracking-[-0.02em]">{row ? row.title : "New programme"}</h1>
      <ProgramEditor initial={data} published={published} isNew={!row} slots={slots} />
    </>
  );
}
