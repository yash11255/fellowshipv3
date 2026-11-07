"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteContent, saveContent } from "@/lib/admin-actions";
import { Card, btn, btnGhost, input } from "./ui";

type Initial = { slug: string; title: string; body: string; excerpt?: string; image?: string; seoTitle: string; seoDescription: string; published: boolean };
const SNIPPETS: [string, string][] = [["H2", "<h2>Heading</h2>"], ["H3", "<h3>Subheading</h3>"], ["¶", "<p>Paragraph</p>"], ["List", "<ul>\n  <li>Item</li>\n</ul>"], ["Link", '<a href="https://">Link text</a>'], ["Image", '<img src="/content/…" alt="Describe the image">'], ["FAQ", "<details><summary>Question?</summary><p>Answer.</p></details>"]];

export function ContentEditor({ kind, initial, isNew }: { kind: "page" | "article"; initial: Initial; isNew: boolean }) {
  const router = useRouter();
  const [c, setC] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [pending, start] = useTransition();
  const url = kind === "page" ? `/${c.slug}` : `/journal/${c.slug}`;

  const save = () => start(async () => {
    const r = await saveContent(kind, isNew ? null : initial.slug, c);
    setMsg(r.ok ? { ok: true, text: "Saved. Live on the site." } : { ok: false, text: r.error });
    if (r.ok && (isNew || r.slug !== initial.slug)) router.replace(`/admin/content/edit?kind=${kind}&slug=${encodeURIComponent(r.slug)}`);
    else if (r.ok) router.refresh();
  });
  const insert = (snippet: string) => setC((s) => ({ ...s, body: `${s.body}\n${snippet}` }));

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <Card className="space-y-4 p-4">
          <label className="block"><span className="text-[13px] font-medium">Title</span><input className={`${input} mt-1`} value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></label>
          <label className="block"><span className="text-[13px] font-medium">URL</span>
            <div className="mt-1 flex items-center rounded-lg border border-[#d4d4d4] bg-white"><span className="pl-3 text-[13px] text-grey">{kind === "page" ? "/" : "/journal/"}</span>
              <input className="h-9 flex-1 rounded-lg bg-transparent pr-3 text-[14px] outline-none" value={c.slug} onChange={(e) => setC({ ...c, slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, "-") })} /></div>
          </label>
          {kind === "article" && (
            <>
              <label className="block"><span className="text-[13px] font-medium">Excerpt (shown on the journal list)</span><textarea rows={2} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[14px]" value={c.excerpt ?? ""} onChange={(e) => setC({ ...c, excerpt: e.target.value })} /></label>
              <label className="block"><span className="text-[13px] font-medium">Cover image path</span><input className={`${input} mt-1`} placeholder="/content/journal/…" value={c.image ?? ""} onChange={(e) => setC({ ...c, image: e.target.value })} /></label>
            </>
          )}
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-1 border-b border-[#ececec] px-3 py-2">
            {(["edit", "preview"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1 text-[13px] capitalize ${tab === t ? "bg-[#ebebeb] font-semibold" : ""}`}>{t}</button>)}
            {tab === "edit" && <span className="ml-auto flex flex-wrap gap-1">{SNIPPETS.map(([l, s]) => <button key={l} onClick={() => insert(s)} className="rounded border border-[#e3e3e3] px-2 py-0.5 text-[12px] hover:bg-[#f4f4f4]" title={`Insert ${l}`}>{l}</button>)}</span>}
          </div>
          {tab === "edit" ? (
            <textarea aria-label="Content (HTML)" value={c.body} onChange={(e) => setC({ ...c, body: e.target.value })} rows={26} spellCheck={false}
              className="w-full resize-y p-4 font-mono text-[13px] leading-relaxed outline-none" />
          ) : (
            <div className="prose-rc max-w-none p-6" dangerouslySetInnerHTML={{ __html: c.body }} />
          )}
          <p className="border-t border-[#ececec] px-4 py-2 text-[12px] text-grey">HTML is cleaned on save: scripts, styles and embeds are removed. Use the buttons above to insert common blocks.</p>
        </Card>
      </div>
      <div className="space-y-4">
        <Card title="Visibility" className="p-0">
          <label className="flex items-center gap-3 p-4 text-[13px]"><input type="checkbox" className="size-4 accent-black" checked={c.published} onChange={(e) => setC({ ...c, published: e.target.checked })} /> Published (visible on the site)</label>
        </Card>
        <Card title="Search engine listing" className="p-0">
          <div className="space-y-3 p-4">
            <div className="rounded-lg border border-[#ececec] p-3"><p className="truncate text-[17px] text-[#1a0dab]">{c.seoTitle || c.title}</p><p className="line-clamp-2 text-[13px] text-[#4d5156]">{c.seoDescription || c.excerpt || "Add a meta description."}</p></div>
            <label className="block"><span className="text-[13px] font-medium">SEO title ({(c.seoTitle || "").length}/60)</span><input className={`${input} mt-1`} value={c.seoTitle} onChange={(e) => setC({ ...c, seoTitle: e.target.value })} /></label>
            <label className="block"><span className="text-[13px] font-medium">Meta description ({(c.seoDescription || "").length}/160)</span><textarea rows={3} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[13px]" value={c.seoDescription} onChange={(e) => setC({ ...c, seoDescription: e.target.value })} /></label>
          </div>
        </Card>
        <div className="sticky bottom-4 space-y-2 rounded-xl border border-[#e3e3e3] bg-white p-4">
          {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
          <button onClick={save} disabled={pending} className={`${btn} w-full`}>{pending ? "Saving…" : isNew ? "Create" : "Save"}</button>
          {!isNew && <a href={url} target="_blank" rel="noreferrer" className={`${btnGhost} w-full`}>View on site ↗</a>}
          {!isNew && <button className="w-full text-[12px] text-sale hover:underline" onClick={() => confirm("Delete permanently?") && start(async () => { await deleteContent(kind, initial.slug); router.push("/admin/content"); })}>Delete</button>}
        </div>
      </div>
    </div>
  );
}
