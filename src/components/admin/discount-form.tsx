"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDiscount, saveDiscount } from "@/lib/admin-actions";
import { btn, btnGhost, input } from "./ui";

export type DiscountRow = {
  id: number; code: string; type: "percent" | "fixed" | "free_shipping"; value: number; minSubtotal: number; maxDiscount: number | null;
  startsAt: string | null; endsAt: string | null; usageLimit: number | null; usedCount: number; oncePerCustomer: boolean; active: boolean;
};

const blank: Omit<DiscountRow, "id" | "usedCount"> = { code: "", type: "percent", value: 10, minSubtotal: 0, maxDiscount: null, startsAt: null, endsAt: null, usageLimit: null, oncePerCustomer: false, active: true };
const n = (s: string) => (s === "" ? null : Math.max(0, Math.round(Number(s) || 0)));

export function DiscountForm({ row, onDone }: { row?: DiscountRow; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState(row ? { ...row } : { ...blank });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    start(async () => {
      const r = await saveDiscount(row?.id ?? null, {
        code: f.code, type: f.type, value: f.type === "free_shipping" ? 0 : f.value, minSubtotal: f.minSubtotal, maxDiscount: f.type === "percent" ? f.maxDiscount : null,
        startsAt: f.startsAt, endsAt: f.endsAt, usageLimit: f.usageLimit, oncePerCustomer: f.oncePerCustomer, active: f.active,
      });
      if (!r.ok) return setErr(r.error);
      router.refresh(); onDone();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-[13px] font-medium">Code</span>
          <input required className={`${input} mt-1 uppercase`} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" />
        </label>
        <label className="block"><span className="text-[13px] font-medium">Type</span>
          <select className={`${input} mt-1`} value={f.type} onChange={(e) => set("type", e.target.value as DiscountRow["type"])}>
            <option value="percent">Percentage off</option><option value="fixed">Fixed amount off (₹)</option><option value="free_shipping">Free shipping</option>
          </select>
        </label>
        {f.type !== "free_shipping" && (
          <label className="block"><span className="text-[13px] font-medium">{f.type === "percent" ? "Percent off" : "Amount off (₹)"}</span>
            <input inputMode="numeric" className={`${input} mt-1`} value={f.value} onChange={(e) => set("value", n(e.target.value) ?? 0)} />
          </label>
        )}
        {f.type === "percent" && (
          <label className="block"><span className="text-[13px] font-medium">Max discount (₹, optional)</span>
            <input inputMode="numeric" className={`${input} mt-1`} value={f.maxDiscount ?? ""} onChange={(e) => set("maxDiscount", n(e.target.value))} placeholder="No cap" />
          </label>
        )}
        <label className="block"><span className="text-[13px] font-medium">Minimum order (₹)</span>
          <input inputMode="numeric" className={`${input} mt-1`} value={f.minSubtotal} onChange={(e) => set("minSubtotal", n(e.target.value) ?? 0)} />
        </label>
        <label className="block"><span className="text-[13px] font-medium">Total uses (optional)</span>
          <input inputMode="numeric" className={`${input} mt-1`} value={f.usageLimit ?? ""} onChange={(e) => set("usageLimit", n(e.target.value))} placeholder="Unlimited" />
        </label>
        <label className="block"><span className="text-[13px] font-medium">Starts</span>
          <input type="datetime-local" className={`${input} mt-1`} value={f.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value || null)} />
        </label>
        <label className="block"><span className="text-[13px] font-medium">Ends</span>
          <input type="datetime-local" className={`${input} mt-1`} value={f.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value || null)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-6 text-[13px]">
        <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-black" checked={f.oncePerCustomer} onChange={(e) => set("oncePerCustomer", e.target.checked)} />One use per customer</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="size-4 accent-black" checked={f.active} onChange={(e) => set("active", e.target.checked)} />Active</label>
      </div>
      {err && <p role="alert" className="text-[13px] text-sale">{err}</p>}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button className={btn} disabled={pending}>{pending ? "Saving…" : row ? "Save" : "Create discount"}</button>
          <button type="button" className={btnGhost} onClick={onDone}>Cancel</button>
        </div>
        {row && (
          <button type="button" className="text-[13px] text-sale hover:underline" disabled={pending}
            onClick={() => confirm(`Delete ${row.code}?`) && start(async () => { await deleteDiscount(row.id); router.refresh(); onDone(); })}>Delete</button>
        )}
      </div>
    </form>
  );
}

export function DiscountsManager({ rows }: { rows: DiscountRow[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [now] = useState(() => Date.now());
  const status = (r: DiscountRow) =>
    !r.active ? ["Disabled", "bg-[#ebebeb] text-[#4a4a4a]", "○"]
    : r.endsAt && new Date(r.endsAt).getTime() < now ? ["Expired", "bg-[#ebebeb] text-[#4a4a4a]", "×"]
    : r.startsAt && new Date(r.startsAt).getTime() > now ? ["Scheduled", "bg-[#e0f0ff] text-[#00376b]", "◔"]
    : r.usageLimit !== null && r.usedCount >= r.usageLimit ? ["Used up", "bg-[#ebebeb] text-[#4a4a4a]", "■"]
    : ["Active", "bg-[#cdfee1] text-[#0c5132]", "●"];
  const describe = (r: DiscountRow) =>
    `${r.type === "percent" ? `${r.value}% off${r.maxDiscount ? ` (max ₹${r.maxDiscount})` : ""}` : r.type === "fixed" ? `₹${r.value} off` : "Free shipping"}${r.minSubtotal ? ` · min ₹${r.minSubtotal}` : ""}${r.oncePerCustomer ? " · once per customer" : ""}`;

  return (
    <div className="rounded-xl border border-[#e3e3e3] bg-white">
      <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-3">
        <h2 className="text-[14px] font-semibold">{rows.length} discount codes</h2>
        {editing !== "new" && <button className={btn} onClick={() => setEditing("new")}>Create discount</button>}
      </div>
      {editing === "new" && <div className="border-b border-[#ececec] bg-[#fafafa]"><DiscountForm onDone={() => setEditing(null)} /></div>}
      <ul className="divide-y divide-[#f0f0f0]">
        {rows.map((r) => {
          const [label, cls, icon] = status(r);
          return (
            <li key={r.id}>
              {editing === r.id ? <div className="bg-[#fafafa]"><DiscountForm row={r} onDone={() => setEditing(null)} /></div> : (
                <button onClick={() => setEditing(r.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-[13px] hover:bg-[#fafafa]">
                  <span className="font-mono text-[14px] font-semibold">{r.code}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${cls}`}><span aria-hidden>{icon}</span>{label}</span>
                  <span className="flex-1 text-grey">{describe(r)}</span>
                  <span className="text-grey">{r.usedCount}{r.usageLimit ? ` / ${r.usageLimit}` : ""} used</span>
                </button>
              )}
            </li>
          );
        })}
        {rows.length === 0 && editing !== "new" && <li className="px-4 py-10 text-center text-[13px] text-grey">No discounts yet. Create one like WELCOME10 for first orders.</li>}
      </ul>
    </div>
  );
}
