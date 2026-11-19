"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSlot, deleteSlot, generateMonthlySlots, setSlotStatus, updateSlot } from "@/lib/slot-actions";
import { Card, btn, btnGhost, input } from "./ui";

export type SlotDTO = {
  id: number; label: string; startDate: string; endDate: string | null;
  capacity: number; confirmedCount: number; balanceDueDays: number; status: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_CLS: Record<string, string> = { open: "bg-[#cdfee1] text-[#0c5132]", closed: "bg-[#ebebeb] text-[#4a4a4a]", cancelled: "bg-[#ffd9d9] text-[#7a1212]" };

function SlotRow({ programSlug, s, onChanged }: { programSlug: string; s: SlotDTO; onChanged: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [cap, setCap] = useState(String(s.capacity));
  const seatsLeft = Math.max(0, s.capacity - s.confirmedCount);
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); if (!r.ok) setErr(r.error ?? "Failed"); else { setErr(null); onChanged(); } });
  const saveCapacity = () => { const n = Number(cap); if (n > 0 && n !== s.capacity) act(() => updateSlot({ id: s.id, programSlug, capacity: n })); };
  return (
    <tr className="border-b border-[#f0f0f0] text-[13px]">
      <td className="px-3 py-2.5">
        <span className="block font-medium">{s.label}</span>
        <span className="text-grey">{fmt(s.startDate)}{s.endDate ? ` – ${fmt(s.endDate)}` : ""}</span>
        {err && <span className="mt-1 block text-[12px] text-sale">{err}</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${seatsLeft === 0 ? "bg-[#ffd9d9] text-[#7a1212]" : "bg-[#f0f0f0]"}`}>{seatsLeft} of {s.capacity} left</span>
          <input aria-label="Capacity" type="number" min={s.confirmedCount || 1} value={cap} onChange={(e) => setCap(e.target.value)} onBlur={saveCapacity} className="h-6 w-14 rounded border border-[#d4d4d4] px-1 text-[12px]" />
        </div>
      </td>
      <td className="px-3 py-2.5">{s.balanceDueDays}d</td>
      <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_CLS[s.status] ?? ""}`}>{s.status}</span></td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1.5">
          {s.status === "open" ? (
            <button disabled={pending} className={btnGhost} onClick={() => act(() => setSlotStatus(s.id, programSlug, "closed"))}>Close</button>
          ) : s.status === "closed" ? (
            <button disabled={pending} className={btnGhost} onClick={() => act(() => setSlotStatus(s.id, programSlug, "open"))}>Reopen</button>
          ) : null}
          {s.status !== "cancelled" && <button disabled={pending} className="px-2 text-[12px] text-sale" onClick={() => confirm("Cancel this batch? Applicants assigned to it keep their record but it stops accepting new ones.") && act(() => setSlotStatus(s.id, programSlug, "cancelled"))}>Cancel</button>}
          {s.confirmedCount === 0 && <button disabled={pending} className="px-2 text-[12px] text-sale" onClick={() => confirm("Delete this batch?") && act(() => deleteSlot(s.id, programSlug))}>Delete</button>}
        </div>
      </td>
    </tr>
  );
}

export function SlotManager({ programSlug, initial }: { programSlug: string; initial: SlotDTO[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"one" | "bulk">("one");
  const refresh = () => router.refresh();

  return (
    <Card title="Seats & batches" className="p-0">
      <div className="p-4">
        <p className="text-[13px] text-grey">Each batch has a seat cap. &ldquo;X of Y left&rdquo; shows on the programme page and the apply form for urgency. A seat is only claimed once the applicant&apos;s deposit is paid.</p>
        {initial.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead><tr className="border-b border-[#e3e3e3] text-[12px] text-grey"><th className="px-3 py-2">Batch</th><th className="px-3 py-2">Seats</th><th className="px-3 py-2">Balance window</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead>
              <tbody>{initial.map((s) => <SlotRow key={s.id} programSlug={programSlug} s={s} onChanged={refresh} />)}</tbody>
            </table>
          </div>
        )}
        {!initial.length && <p className="mt-3 text-[13px] text-grey">No batches yet — applicants won&apos;t see a batch picker until you add one.</p>}

        <div className="mt-5 flex gap-2 text-[13px]">
          <button type="button" onClick={() => setMode("one")} className={mode === "one" ? btn : btnGhost}>Add one batch</button>
          <button type="button" onClick={() => setMode("bulk")} className={mode === "bulk" ? btn : btnGhost}>Generate several</button>
        </div>

        {mode === "one" ? (
          <form className="mt-4 grid gap-3 rounded-lg border border-[#ececec] p-3 md:grid-cols-2" onSubmit={(e) => {
            e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "");
            setErr(null); setMsg(null);
            start(async () => {
              const r = await createSlot({ programSlug, label: g("label"), startDate: g("startDate"), endDate: g("endDate") || undefined, capacity: Number(g("capacity")), balanceDueDays: Number(g("balanceDueDays") || 14) });
              if (!r.ok) setErr(r.error); else { setMsg("Batch added."); e.currentTarget.reset(); refresh(); }
            });
          }}>
            <label className="block md:col-span-2"><span className="text-[12px] font-medium">Batch name</span><input name="label" required placeholder="December 2026 · Gurugram" className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Starts</span><input name="startDate" type="datetime-local" required className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Ends (optional)</span><input name="endDate" type="datetime-local" className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Seats</span><input name="capacity" type="number" min={1} defaultValue={4} required className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Balance due within (days of deposit)</span><input name="balanceDueDays" type="number" min={0} defaultValue={14} className={`${input} mt-1`} /></label>
            <div className="md:col-span-2"><button disabled={pending} className={btn}>{pending ? "Adding…" : "Add batch"}</button></div>
          </form>
        ) : (
          <form className="mt-4 grid gap-3 rounded-lg border border-[#ececec] p-3 md:grid-cols-2" onSubmit={(e) => {
            e.preventDefault(); const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "");
            setErr(null); setMsg(null);
            start(async () => {
              const r = await generateMonthlySlots({ programSlug, labelTemplate: g("labelTemplate") || "{month} {year} batch", startMonth: g("startMonth"), count: Number(g("count") || 1), dayOfMonth: Number(g("dayOfMonth") || 1), durationDays: Number(g("durationDays") || 0), capacity: Number(g("capacity")), balanceDueDays: Number(g("balanceDueDays") || 14) });
              if (!r.ok) setErr(r.error); else { setMsg(`${r.count} batches created.`); e.currentTarget.reset(); refresh(); }
            });
          }}>
            <label className="block md:col-span-2"><span className="text-[12px] font-medium">Name template</span><input name="labelTemplate" defaultValue="{month} {year} batch" className={`${input} mt-1`} /><span className="mt-1 block text-[11px] text-grey">Use {"{month}"} and {"{year}"} — e.g. one batch per month, every month.</span></label>
            <label className="block"><span className="text-[12px] font-medium">Starting month</span><input name="startMonth" type="month" required className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">How many months</span><input name="count" type="number" min={1} max={24} defaultValue={6} className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Day of month it starts</span><input name="dayOfMonth" type="number" min={1} max={28} defaultValue={1} className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Batch length (days, 0 = none)</span><input name="durationDays" type="number" min={0} max={90} defaultValue={30} className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Seats per batch</span><input name="capacity" type="number" min={1} defaultValue={4} required className={`${input} mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-medium">Balance due within (days of deposit)</span><input name="balanceDueDays" type="number" min={0} defaultValue={14} className={`${input} mt-1`} /></label>
            <div className="md:col-span-2"><button disabled={pending} className={btn}>{pending ? "Generating…" : "Generate batches"}</button></div>
          </form>
        )}
        {err && <p role="alert" className="mt-2 text-[13px] text-sale">{err}</p>}
        {msg && <p role="status" className="mt-2 text-[13px] text-ok">{msg}</p>}
      </div>
    </Card>
  );
}
