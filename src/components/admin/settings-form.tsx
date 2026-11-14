"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveIntegration, saveSeo, saveStoreSettings, testIntegration } from "@/lib/admin-actions";
import { btn, btnGhost, input } from "./ui";

export type Field =
  | { name: string; label: string; type: "text" | "url" | "number"; help?: string; placeholder?: string; max?: number }
  | { name: string; label: string; type: "textarea"; help?: string; max?: number }
  | { name: string; label: string; type: "toggle"; help?: string }
  | { name: string; label: string; type: "secret"; help?: string }
  | { name: string; label: string; type: "select"; options: [string, string][]; help?: string };

type Target = { kind: "store" } | { kind: "seo" } | { kind: "integration"; name: "razorpay" | "shiprocket" | "delhivery" | "shipping"; testable?: boolean };
type Values = Record<string, string | number | boolean>;

export function SettingsForm({ title, description, fields, initial, target, children }: {
  title: string; description?: string; fields: Field[]; initial: Values; target: Target; children?: React.ReactNode;
}) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);

  const save = (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    start(async () => {
      const r = target.kind === "store" ? await saveStoreSettings(v as never)
        : target.kind === "seo" ? await saveSeo(v as never)
        : await saveIntegration(target.name, v as Record<string, string | boolean>);
      setMsg(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });
  };
  const test = () => start(async () => {
    if (target.kind !== "integration" || target.name !== "razorpay") return;
    const r = await testIntegration(target.name, { keyId: String(v.keyId ?? ""), keySecret: String(v.keySecret ?? "") });
    setMsg(r.ok ? { ok: true, text: "Connected successfully ✓" } : { ok: false, text: r.error });
  });

  return (
    <form onSubmit={save} className="rounded-xl border border-[#e3e3e3] bg-white">
      <div className="border-b border-[#ececec] px-4 py-3">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-grey">{description}</p>}
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        {fields.map((f) => {
          const val = v[f.name];
          if (f.type === "toggle") return (
            <label key={f.name} className="flex items-start gap-3 md:col-span-2">
              <input type="checkbox" className="mt-0.5 size-4 accent-black" checked={!!val} onChange={(e) => setV({ ...v, [f.name]: e.target.checked })} />
              <span><span className="block text-[13px] font-medium">{f.label}</span>{f.help && <span className="text-[12px] text-grey">{f.help}</span>}</span>
            </label>
          );
          return (
            <label key={f.name} className={`block ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
              <span className="flex justify-between text-[13px] font-medium">{f.label}
                {"max" in f && f.max && <span className={`text-[12px] font-normal ${String(val ?? "").length > f.max ? "text-sale" : "text-grey"}`}>{String(val ?? "").length}/{f.max}</span>}
              </span>
              {f.type === "textarea" ? (
                <textarea rows={3} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[14px] outline-none focus:border-black" value={String(val ?? "")} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
              ) : f.type === "select" ? (
                <select className={`${input} mt-1`} value={String(val ?? "")} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}>
                  {f.options.map(([o, l]) => <option key={o} value={o}>{l}</option>)}
                </select>
              ) : f.type === "secret" ? (
                <input type="password" autoComplete="off" className={`${input} mt-1`} placeholder={val === "__set__" ? "Saved, leave blank to keep" : "Not set"}
                  value={val === "__set__" ? "" : String(val ?? "")} onChange={(e) => setV({ ...v, [f.name]: e.target.value || (initial[f.name] === "__set__" ? "__set__" : "") })} />
              ) : (
                <input type={f.type === "number" ? "text" : f.type} inputMode={f.type === "number" ? "numeric" : undefined} placeholder={f.placeholder} className={`${input} mt-1`}
                  value={String(val ?? "")} onChange={(e) => setV({ ...v, [f.name]: f.type === "number" ? Math.max(0, Math.round(Number(e.target.value) || 0)) : e.target.value })} />
              )}
              {f.help && <span className="mt-1 block text-[12px] text-grey">{f.help}</span>}
            </label>
          );
        })}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#ececec] px-4 py-3">
        {msg && <p role="status" className={`mr-auto text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
        {target.kind === "integration" && target.testable && <button type="button" onClick={test} disabled={pending} className={btnGhost}>Test connection</button>}
        <button className={btn} disabled={!dirty || pending}>{pending ? "Saving…" : "Save"}</button>
      </div>
    </form>
  );
}
