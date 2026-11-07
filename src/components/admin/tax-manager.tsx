"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTax } from "@/lib/admin-actions";
import type { TaxSettings } from "@/lib/tax";
import { btn, btnGhost, input } from "./ui";

const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

export function TaxManager({ initial, usage }: { initial: TaxSettings; usage: Record<string, number> }) {
  const router = useRouter();
  const [t, setT] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(t) !== JSON.stringify(initial);
  const setSlab = (i: number, patch: Partial<TaxSettings["slabs"][number]>) => setT({ ...t, slabs: t.slabs.map((s, k) => (k === i ? { ...s, ...patch } : s)) });

  const save = () => start(async () => {
    const r = await saveTax(t);
    setMsg(r.ok ? { ok: true, text: "Saved. New orders use these rates." } : { ok: false, text: r.error });
    if (r.ok) router.refresh();
  });

  return (
    <>
      <section className="rounded-xl border border-[#e3e3e3] bg-white">
        <div className="border-b border-[#ececec] px-4 py-3">
          <h2 className="text-[14px] font-semibold">Business details</h2>
          <p className="mt-0.5 text-[13px] text-grey">Printed on GST invoices. Your business state decides CGST+SGST (same state) or IGST (other states).</p>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <label className="block"><span className="text-[13px] font-medium">Legal business name</span><input className={`${input} mt-1`} value={t.legalName} onChange={(e) => setT({ ...t, legalName: e.target.value })} /></label>
          <label className="block"><span className="text-[13px] font-medium">GSTIN</span><input className={`${input} mt-1 uppercase`} placeholder="07ABCDE1234F1Z5" value={t.gstin} onChange={(e) => setT({ ...t, gstin: e.target.value.toUpperCase().trim() })} /></label>
          <label className="block"><span className="text-[13px] font-medium">Business (origin) state</span>
            <select className={`${input} mt-1`} value={t.businessState} onChange={(e) => setT({ ...t, businessState: e.target.value })}>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label className="flex items-start gap-3 pt-6"><input type="checkbox" className="mt-0.5 size-4 accent-black" checked={t.pricesIncludeTax} onChange={(e) => setT({ ...t, pricesIncludeTax: e.target.checked })} />
            <span><span className="block text-[13px] font-medium">Prices include GST</span><span className="text-[12px] text-grey">Standard for Indian retail (MRP). GST is extracted from the price.</span></span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[#e3e3e3] bg-white">
        <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-3">
          <div><h2 className="text-[14px] font-semibold">Tax slabs</h2><p className="mt-0.5 text-[13px] text-grey">Assign a slab to each product in the product editor.</p></div>
          <button type="button" className={btnGhost} onClick={() => setT({ ...t, slabs: [...t.slabs, { id: `slab${t.slabs.length + 1}`, name: "New slab", rate: 0 }] })}>Add slab</button>
        </div>
        <table className="w-full text-[13px]">
          <thead className="text-left text-[12px] text-grey"><tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Name</th><th className="px-2 py-2 font-medium">Rate %</th><th className="px-2 py-2 font-medium">ID</th><th className="px-2 py-2 font-medium">Products</th><th className="px-2 py-2 font-medium">Default</th><th className="px-4 py-2" /></tr></thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {t.slabs.map((s, i) => (
              <tr key={i}>
                <td className="px-4 py-2"><input aria-label="Slab name" className={input} value={s.name} onChange={(e) => setSlab(i, { name: e.target.value })} /></td>
                <td className="px-2 py-2"><input aria-label="Rate" inputMode="decimal" className={`${input} w-20`} value={s.rate} onChange={(e) => setSlab(i, { rate: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })} /></td>
                <td className="px-2 py-2"><input aria-label="Slab ID" className={`${input} w-28 font-mono text-[12px]`} value={s.id} disabled={!!usage[s.id]} onChange={(e) => setSlab(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} /></td>
                <td className="px-2 py-2 text-grey">{usage[s.id] ?? 0}</td>
                <td className="px-2 py-2"><input type="radio" name="default" aria-label="Default slab" className="size-4 accent-black" checked={t.defaultSlab === s.id} onChange={() => setT({ ...t, defaultSlab: s.id })} /></td>
                <td className="px-4 py-2 text-right">
                  <button type="button" disabled={!!usage[s.id] || t.defaultSlab === s.id} className="text-[12px] text-sale hover:underline disabled:text-mute disabled:no-underline"
                    title={usage[s.id] ? "In use by products" : undefined} onClick={() => setT({ ...t, slabs: t.slabs.filter((_, k) => k !== i) })}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="px-4 py-3 text-[12px] text-grey">Most nutraceuticals and supplements (HSN 2106) are 18%. Confirm classification with your CA. Changes apply to new orders only.</p>
      </section>

      <div className="flex items-center justify-end gap-3">
        {msg && <p role="status" className={`mr-auto text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
        <button className={btn} disabled={!dirty || pending} onClick={save}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </>
  );
}
