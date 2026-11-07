"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProgram, saveProgram } from "@/lib/cms-actions";
import type { Program } from "@/lib/programs";
import { ImageField } from "./media-picker";
import { Card, btn, btnGhost, input } from "./ui";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const lines = (a?: string[]) => (a ?? []).join("\n");
const unlines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const area = "mt-1 w-full rounded-lg border border-[#d4d4d4] bg-white p-2 text-[14px] leading-relaxed outline-none focus:border-black";

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[13px] font-medium">{label}</span>{children}{help && <span className="mt-1 block text-[12px] text-grey">{help}</span>}</label>;
}

export function ProgramEditor({ initial, published: pub0, isNew }: { initial: Program; published: boolean; isNew: boolean }) {
  const router = useRouter();
  const [p, setP] = useState<Program>(initial);
  const [published, setPublished] = useState(pub0);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof Program>(k: K, v: Program[K]) => setP((s) => ({ ...s, [k]: v }));
  const card = p.card ?? { name: "", line: "", meta: "", tags: [] };

  const save = () => start(async () => {
    const r = await saveProgram(isNew ? null : initial.slug, p, published);
    setMsg(r.ok ? { ok: true, text: published ? "Saved. Live on the site." : "Saved (hidden from the site)." } : { ok: false, text: r.error });
    if (r.ok && (isNew || r.slug !== initial.slug)) router.replace(`/admin/programs/edit?slug=${encodeURIComponent(r.slug)}`);
    else if (r.ok) router.refresh();
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <Card title="Basics" className="p-0"><div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2"><Field label="Programme name"><input className={`${input} mt-1`} value={p.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></Field></div>
          <div className="md:col-span-2"><Field label="URL"><div className="mt-1 flex items-center rounded-lg border border-[#d4d4d4] bg-white"><span className="pl-3 text-[13px] text-grey">/programs/</span><input className="h-9 flex-1 bg-transparent pr-3 text-[14px] outline-none" value={p.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div></Field></div>
          <div className="md:col-span-2"><Field label="Short description" help="Shown under the title and in search results."><textarea rows={3} className={area} value={p.short} onChange={(e) => set("short", e.target.value)} /></Field></div>
          <Field label="Who it's for"><input className={`${input} mt-1`} value={p.audience} onChange={(e) => set("audience", e.target.value)} /></Field>
          <Field label="Duration"><input className={`${input} mt-1`} value={p.duration} onChange={(e) => set("duration", e.target.value)} placeholder="1 month (extendable)" /></Field>
          <Field label="Format & location"><input className={`${input} mt-1`} value={p.format} onChange={(e) => set("format", e.target.value)} placeholder="Offline · in OT, Gurugram" /></Field>
          <Field label="Schedule (optional)"><input className={`${input} mt-1`} value={p.schedule ?? ""} onChange={(e) => set("schedule", e.target.value || undefined)} placeholder="Second week of every month" /></Field>
          <div className="md:col-span-2"><Field label="Upcoming batches" help="One per line, e.g. 10–14 Dec 2026. Shown on the programme page."><textarea rows={3} className={area} value={lines(p.nextDates)} onChange={(e) => set("nextDates", unlines(e.target.value))} /></Field></div>
        </div></Card>

        <Card title="Fees" className="p-0"><div className="space-y-3 p-4">
          {p.fee.map((f, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px_110px_auto] gap-2">
              <input aria-label="Fee label" className={input} value={f.label} placeholder="Indian surgeons" onChange={(e) => set("fee", p.fee.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input aria-label="Amount in rupees" className={input} inputMode="numeric" value={f.amount || ""} placeholder="₹ amount" onChange={(e) => set("fee", p.fee.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value.replace(/\D/g, "")) } : x)))} />
              <input aria-label="Note" className={input} value={f.note ?? ""} placeholder="+ GST" onChange={(e) => set("fee", p.fee.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
              <button type="button" onClick={() => set("fee", p.fee.filter((_, j) => j !== i))} className="px-2 text-[13px] text-sale">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => set("fee", [...p.fee, { label: "", amount: 0 }])} className={btnGhost}>+ Add fee</button>
          <Field label="Booking deposit (%)" help="Used when accepting an application: the payment link asks for this share of fee + GST. Leave empty for 100%."><input className={`${input} mt-1 max-w-32`} inputMode="numeric" value={p.deposit ?? ""} onChange={(e) => set("deposit", e.target.value ? Number(e.target.value.replace(/\D/g, "")) : undefined)} /></Field>
          <p className="text-[12px] text-grey">No fee? Leave empty and the site shows “Fees shared after you apply”.</p>
        </div></Card>

        <Card title="Page content" className="p-0"><div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="md:col-span-2"><Field label="Highlights" help="One per line."><textarea rows={5} className={area} value={lines(p.highlights)} onChange={(e) => set("highlights", unlines(e.target.value))} /></Field></div>
          <Field label="Who should apply" help="One per line."><textarea rows={4} className={area} value={lines(p.eligibility)} onChange={(e) => set("eligibility", unlines(e.target.value))} /></Field>
          <Field label="Outcomes" help="One per line."><textarea rows={4} className={area} value={lines(p.outcomes)} onChange={(e) => set("outcomes", unlines(e.target.value))} /></Field>
        </div></Card>

        <Card title="Curriculum" className="p-0"><div className="space-y-4 p-4">
          {p.curriculum.map((m, i) => (
            <div key={i} className="rounded-lg border border-[#ececec] p-3">
              <div className="flex gap-2">
                <input aria-label="Module title" className={input} value={m.title} placeholder="Module title" onChange={(e) => set("curriculum", p.curriculum.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <button type="button" disabled={i === 0} onClick={() => { const c = [...p.curriculum]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; set("curriculum", c); }} className="px-2 text-[13px] disabled:opacity-30" aria-label="Move up">↑</button>
                <button type="button" onClick={() => set("curriculum", p.curriculum.filter((_, j) => j !== i))} className="px-2 text-[13px] text-sale">Remove</button>
              </div>
              <textarea rows={4} aria-label="Topics, one per line" className={area} value={lines(m.items)} placeholder="Topics, one per line" onChange={(e) => set("curriculum", p.curriculum.map((x, j) => (j === i ? { ...x, items: unlines(e.target.value) } : x)))} />
            </div>
          ))}
          <button type="button" onClick={() => set("curriculum", [...p.curriculum, { title: "", items: [] }])} className={btnGhost}>+ Add module</button>
        </div></Card>

        <Card title="Homepage card" className="p-0"><div className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="Short name"><input className={`${input} mt-1`} value={card.name} onChange={(e) => set("card", { ...card, name: e.target.value })} /></Field>
          <Field label="Meta line"><input className={`${input} mt-1`} value={card.meta} placeholder="1 month · Gurugram" onChange={(e) => set("card", { ...card, meta: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="One-line pitch"><input className={`${input} mt-1`} value={card.line} onChange={(e) => set("card", { ...card, line: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Tags" help="Comma separated, up to 6."><input className={`${input} mt-1`} value={card.tags.join(", ")} onChange={(e) => set("card", { ...card, tags: e.target.value.split(",").map((t) => t.trim()).slice(0, 6) })} /></Field></div>
          <p className="text-[12px] text-grey md:col-span-2">The first four visible programmes with a card appear in the homepage showcase, in list order.</p>
        </div></Card>
      </div>

      <div className="space-y-4">
        <div className="z-20 space-y-3 rounded-xl xl:sticky xl:top-4 border border-[#e3e3e3] bg-white p-4">
          <label className="flex items-center gap-3 text-[13px]"><input type="checkbox" className="size-4 accent-black" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Visible on the site</label>
          {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
          <button onClick={save} disabled={pending} className={`${btn} w-full`}>{pending ? "Saving…" : isNew ? "Create programme" : "Save changes"}</button>
          {!isNew && <a href={`/programs/${initial.slug}`} target="_blank" rel="noreferrer" className={`${btnGhost} w-full`}>View page ↗</a>}
        </div>
        <Card title="Images" className="p-0"><div className="space-y-4 p-4">
          <ImageField label="Cover image" value={p.image} onChange={(v) => set("image", v)} help="Hero image and card photo." />
          <div>
            <p className="text-[13px] font-medium">Extra photos <span className="font-normal text-grey">(programme page gallery)</span></p>
            <ul className="mt-2 grid grid-cols-3 gap-2">
              {(p.gallery ?? []).map((g, i) => (
                <li key={g + i} className="group relative aspect-square overflow-hidden rounded-lg bg-[#f4f4f4]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
                  <img src={g} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set("gallery", (p.gallery ?? []).filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-[11px] text-sale">✕</button>
                </li>
              ))}
            </ul>
            <div className="mt-2"><ImageField label="Add photo" value="" onChange={(v) => v && set("gallery", [...(p.gallery ?? []), v])} /></div>
            <p className="mt-1 text-[12px] text-grey">Leave empty to use the standard college photos.</p>
          </div>
        </div></Card>
        <Card title="Internal note" className="p-0"><div className="p-4"><textarea rows={3} className={area} value={p.confirm ?? ""} placeholder="Private note for the team (not shown on site)" onChange={(e) => set("confirm", e.target.value || undefined)} /></div></Card>
        {!isNew && <button className="text-[12px] text-sale hover:underline" onClick={() => confirm("Delete this programme? Programmes with applications can only be hidden.") && start(async () => { const r = await deleteProgram(initial.slug); if (r.ok) router.push("/admin/programs"); else setMsg({ ok: false, text: r.error }); })}>Delete programme</button>}
      </div>
    </div>
  );
}
