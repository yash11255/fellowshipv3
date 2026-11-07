"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/lib/admin-actions";
import { Card, btn, input } from "./ui";

type V = { id: number; months: number; price: number; compareAt: number; available: boolean; stock: number | null; sku: string | null };

export function ProductEditor({ handle, initial, siteUrl, slabs }: { handle: string; siteUrl: string; slabs: { id: string; name: string }[]; initial: { title: string; description: string; status: string; seoTitle: string; seoDescription: string; taxSlab: string; hsn: string; variants: V[] } }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(p) !== JSON.stringify(initial);
  const setV = (i: number, patch: Partial<V>) => setP((s) => ({ ...s, variants: s.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) }));
  const num = (s: string) => (s === "" ? 0 : Math.max(0, Math.round(Number(s) || 0)));

  const save = () => start(async () => {
    const r = await saveProduct(handle, { ...p, status: p.status as "active" | "draft" | "archived" });
    setMsg(r.ok ? { ok: true, text: "Saved. Live on the store." } : { ok: false, text: r.error });
    if (r.ok) router.refresh();
  });

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card className="space-y-4 p-4">
          <label className="block"><span className="text-[13px] font-medium">Title</span>
            <input className={`${input} mt-1`} value={p.title} onChange={(e) => setP({ ...p, title: e.target.value })} />
          </label>
          <label className="block"><span className="text-[13px] font-medium">Description</span>
            <textarea rows={7} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-3 text-[14px] outline-none focus:border-black focus:ring-1 focus:ring-black"
              value={p.description} onChange={(e) => setP({ ...p, description: e.target.value })} />
          </label>
        </Card>

        <Card title="Search engine listing">
          <div className="space-y-4 p-4">
            <div className="rounded-lg border border-[#ececec] p-3">
              <p className="text-[12px] text-grey">Google preview</p>
              <p className="mt-1 truncate text-[12px] text-[#202124]">{siteUrl.replace(/^https?:\/\//, "")} › products › {handle}</p>
              <p className="truncate text-[18px] leading-snug text-[#1a0dab]">{p.seoTitle || p.title}</p>
              <p className="line-clamp-2 text-[13px] text-[#4d5156]">{p.seoDescription || p.description.slice(0, 160)}</p>
            </div>
            <label className="block"><span className="flex justify-between text-[13px] font-medium">Page title <span className={`font-normal ${(p.seoTitle || "").length > 60 ? "text-sale" : "text-grey"}`}>{(p.seoTitle || "").length}/60</span></span>
              <input className={`${input} mt-1`} placeholder={p.title} value={p.seoTitle} onChange={(e) => setP({ ...p, seoTitle: e.target.value })} />
            </label>
            <label className="block"><span className="flex justify-between text-[13px] font-medium">Meta description <span className={`font-normal ${(p.seoDescription || "").length > 160 ? "text-sale" : "text-grey"}`}>{(p.seoDescription || "").length}/160</span></span>
              <textarea rows={3} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[14px] outline-none focus:border-black" placeholder="Leave empty to use the start of the description"
                value={p.seoDescription} onChange={(e) => setP({ ...p, seoDescription: e.target.value })} />
            </label>
          </div>
        </Card>

        <Card title="Pricing & inventory">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead className="text-left text-[12px] text-grey">
                <tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Supply</th><th className="px-2 py-2 font-medium">Price ₹</th><th className="px-2 py-2 font-medium">Compare-at ₹</th><th className="px-2 py-2 font-medium">Stock</th><th className="px-2 py-2 font-medium">SKU</th><th className="px-4 py-2 font-medium">Selling</th></tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {p.variants.map((v, i) => (
                  <tr key={v.id}>
                    <td className="px-4 py-2 font-medium">{v.months ? `${v.months} month${v.months > 1 ? "s" : ""}` : "Default"}</td>
                    <td className="px-2 py-2"><input aria-label="Price" inputMode="numeric" className={`${input} w-24`} value={v.price} onChange={(e) => setV(i, { price: num(e.target.value) })} /></td>
                    <td className="px-2 py-2"><input aria-label="Compare-at price" inputMode="numeric" className={`${input} w-24`} value={v.compareAt} onChange={(e) => setV(i, { compareAt: num(e.target.value) })} /></td>
                    <td className="px-2 py-2"><input aria-label="Stock" inputMode="numeric" placeholder="Not tracked" className={`${input} w-28`} value={v.stock ?? ""} onChange={(e) => setV(i, { stock: e.target.value === "" ? null : num(e.target.value) })} /></td>
                    <td className="px-2 py-2"><input aria-label="SKU" className={`${input} w-36`} value={v.sku ?? ""} onChange={(e) => setV(i, { sku: e.target.value })} /></td>
                    <td className="px-4 py-2"><input type="checkbox" aria-label="Available for sale" checked={v.available} onChange={(e) => setV(i, { available: e.target.checked })} className="size-4 accent-black" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-3 text-[12px] text-grey">Leave stock empty to sell without tracking. Stock 0 shows as sold out.</p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Status" className="p-0">
          <div className="p-4">
            <select className={input} value={p.status} onChange={(e) => setP({ ...p, status: e.target.value })} aria-label="Product status">
              <option value="active">Active (visible on store)</option>
              <option value="draft">Draft (hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </Card>
        <Card title="Tax" className="p-0">
          <div className="space-y-3 p-4">
            <label className="block"><span className="text-[13px] font-medium">GST slab</span>
              <select className={`${input} mt-1`} value={p.taxSlab} onChange={(e) => setP({ ...p, taxSlab: e.target.value })}>
                {slabs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-[13px] font-medium">HSN code</span>
              <input inputMode="numeric" className={`${input} mt-1`} placeholder="e.g. 21069099" value={p.hsn} onChange={(e) => setP({ ...p, hsn: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
            </label>
          </div>
        </Card>
        <div className="sticky bottom-4 rounded-xl border border-[#e3e3e3] bg-white p-4">
          {msg && <p role="status" className={`mb-2 text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
          <button onClick={save} disabled={!dirty || pending} className={`${btn} w-full`}>{pending ? "Saving…" : dirty ? "Save changes" : "No changes"}</button>
        </div>
      </div>
    </div>
  );
}
