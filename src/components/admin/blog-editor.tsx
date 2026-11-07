"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteArticle, saveArticle } from "@/lib/cms-actions";
import { analyzeSeo, scoreTone } from "@/lib/seo-analyzer";
import { RichEditor } from "./rich-editor";
import { ImageField } from "./media-picker";
import { Card, btn, btnGhost, input } from "./ui";

export type PostDraft = { slug: string; title: string; body: string; excerpt: string; image: string; author: string; tags: string[]; focusKeyword: string; seoTitle: string; seoDescription: string; published: boolean; publishedAt: string };
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function ScoreRing({ score }: { score: number }) {
  const t = scoreTone(score); const r = 26; const c = 2 * Math.PI * r;
  return (
    <div className="relative size-16 shrink-0">
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden><circle cx="32" cy="32" r={r} fill="none" stroke="#eee" strokeWidth="6" /><circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className={t.stroke} strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset .4s" }} /></svg>
      <span className="absolute inset-0 grid place-items-center text-[16px] font-semibold">{score}</span>
    </div>
  );
}

export function BlogEditor({ initial, isNew, siteUrl, related }: { initial: PostDraft; isNew: boolean; siteUrl: string; related: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tagText, setTagText] = useState(initial.tags.join(", "));
  const [pending, start] = useTransition();
  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) => setP((s) => ({ ...s, [k]: v }));
  const report = useMemo(() => analyzeSeo(p), [p]);
  const tone = scoreTone(report.score);
  const scheduled = p.published && new Date(p.publishedAt) > new Date();
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const save = (publish?: boolean) => start(async () => {
    const data = { ...p, published: publish ?? p.published, tags: tagText.split(",").map((t) => t.trim()).filter(Boolean), publishedAt: new Date(p.publishedAt).toISOString() };
    const r = await saveArticle(isNew ? null : initial.slug, data);
    setMsg(r.ok ? { ok: true, text: data.published ? (new Date(data.publishedAt) > new Date() ? "Scheduled." : "Published. Live on the site.") : "Draft saved." } : { ok: false, text: r.error });
    if (r.ok) { setP(data); if (isNew || r.slug !== initial.slug) router.replace(`/admin/blog/edit?slug=${encodeURIComponent(r.slug)}`); else router.refresh(); }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-4">
        <Card className="space-y-4 p-4">
          <input aria-label="Title" placeholder="Post title" value={p.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }}
            className="w-full bg-transparent text-[26px] font-semibold tracking-[-0.02em] outline-none placeholder:text-[#bbb]" />
          <label className="block"><span className="text-[13px] font-medium">URL</span>
            <div className="mt-1 flex items-center rounded-lg border border-[#d4d4d4] bg-white"><span className="pl-3 text-[13px] text-grey">/journal/</span>
              <input className="h-9 flex-1 rounded-lg bg-transparent pr-3 text-[14px] outline-none" value={p.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>
          </label>
        </Card>
        <RichEditor value={p.body} onChange={(v) => set("body", v)} />
        <Card className="space-y-4 p-4">
          <label className="block"><span className="text-[13px] font-medium">Excerpt <span className="font-normal text-grey">(blog list & fallback description)</span></span><textarea rows={2} maxLength={400} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[14px]" value={p.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></label>
          {related.length > 0 && (
            <div>
              <p className="text-[13px] font-medium">Internal link ideas <span className="font-normal text-grey">(copy a URL into a link)</span></p>
              <ul className="mt-2 flex flex-wrap gap-2">{related.map((r) => <li key={r.slug}><button type="button" onClick={() => navigator.clipboard.writeText(`/journal/${r.slug}`)} className="rounded-full border border-[#e3e3e3] px-3 py-1 text-[12px] hover:bg-[#f4f4f4]" title={`Copy /journal/${r.slug}`}>{r.title.slice(0, 60)}</button></li>)}</ul>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <div className="z-20 space-y-2 rounded-xl xl:sticky xl:top-4 border border-[#e3e3e3] bg-white p-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className={`rounded-full px-2 py-0.5 font-medium ${p.published ? (scheduled ? "bg-[#e0f0ff] text-[#00376b]" : "bg-[#cdfee1] text-[#0c5132]") : "bg-[#ebebeb]"}`}>{p.published ? (scheduled ? "Scheduled" : "Published") : "Draft"}</span>
            <span className="text-grey">{report.words} words · {report.readingMin} min read</span>
          </div>
          {msg && <p role="status" className={`text-[13px] ${msg.ok ? "text-ok" : "text-sale"}`}>{msg.text}</p>}
          <div className="flex gap-2">
            <button onClick={() => save(true)} disabled={pending} className={`${btn} flex-1`}>{pending ? "Saving…" : scheduled ? "Schedule" : p.published ? "Update" : "Publish"}</button>
            <button onClick={() => save(false)} disabled={pending} className={btnGhost}>{p.published ? "Unpublish" : "Save draft"}</button>
          </div>
          {!isNew && <a href={`/journal/${initial.slug}`} target="_blank" rel="noreferrer" className={`${btnGhost} w-full`}>View post ↗</a>}
        </div>

        <Card title="SEO score" className="p-0">
          <div className="flex items-center gap-4 p-4">
            <ScoreRing score={report.score} />
            <div><p className={`inline-block rounded-full px-2 py-0.5 text-[12px] font-semibold ${tone.cls}`}>{tone.label}</p><p className="mt-1 text-[12px] text-grey">Fix the red items first. Aim for 80+.</p></div>
          </div>
          <div className="space-y-3 border-t border-[#f0f0f0] p-4">
            <label className="block"><span className="text-[13px] font-medium">Focus keyword</span><input className={`${input} mt-1`} placeholder="e.g. arthroscopy fellowship in India" value={p.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} /></label>
          </div>
          <ul className="max-h-[420px] divide-y divide-[#f4f4f4] overflow-y-auto border-t border-[#f0f0f0]">
            {[...report.checks].sort((a, b) => ({ bad: 0, ok: 1, good: 2 })[a.status] - ({ bad: 0, ok: 1, good: 2 })[b.status]).map((c) => (
              <li key={c.id} className="flex gap-3 px-4 py-2.5 text-[13px]">
                <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${c.status === "good" ? "bg-[#14a44d]" : c.status === "ok" ? "bg-[#e0a100]" : "bg-[#d4351c]"}`} />
                <span><span className={c.status === "good" ? "text-[#303030]" : "font-medium"}>{c.label}</span>{c.status !== "good" && c.tip && <span className="block text-[12px] text-grey">{c.tip}</span>}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Google preview" className="p-0">
          <div className="space-y-3 p-4">
            <div className="rounded-lg border border-[#ececec] p-3">
              <p className="truncate text-[12px] text-[#202124]">{host} › journal › {p.slug || "…"}</p>
              <p className="mt-0.5 line-clamp-1 text-[18px] leading-snug text-[#1a0dab]">{p.seoTitle || p.title || "Post title"}{(p.seoTitle || p.title).length < 50 ? " | Arthroscopy College" : ""}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-[#4d5156]">{p.seoDescription || p.excerpt || "Add a meta description so Google shows your summary instead of a random snippet."}</p>
            </div>
            <label className="block"><span className="flex justify-between text-[13px] font-medium">SEO title <span className={(p.seoTitle || p.title).length > 60 ? "text-sale" : "text-grey"}>{(p.seoTitle || p.title).length}/60</span></span><input maxLength={70} className={`${input} mt-1`} placeholder={p.title} value={p.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></label>
            <label className="block"><span className="flex justify-between text-[13px] font-medium">Meta description <span className={p.seoDescription.length > 160 ? "text-sale" : "text-grey"}>{p.seoDescription.length}/160</span></span><textarea rows={3} maxLength={170} className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[13px]" value={p.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></label>
          </div>
        </Card>

        <Card title="Social preview" className="p-0">
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-[#ececec]">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
              {p.image ? <img src={p.image} alt="" className="aspect-[1.91/1] w-full object-cover" /> : <div className="grid aspect-[1.91/1] place-items-center bg-[#f4f4f4] text-[12px] text-grey">No cover image</div>}
              <div className="bg-[#f7f7f7] p-3"><p className="text-[11px] uppercase text-grey">{host}</p><p className="line-clamp-1 text-[14px] font-semibold">{p.seoTitle || p.title}</p></div>
            </div>
          </div>
        </Card>

        <Card title="Details" className="p-0">
          <div className="space-y-4 p-4">
            <ImageField label="Cover image" value={p.image} onChange={(v) => set("image", v)} help="1200×630 or larger works best." />
            <label className="block"><span className="text-[13px] font-medium">Publish date</span><input type="datetime-local" className={`${input} mt-1`} value={p.publishedAt.slice(0, 16)} onChange={(e) => set("publishedAt", e.target.value)} /><span className="mt-1 block text-[12px] text-grey">A future date schedules the post.</span></label>
            <label className="block"><span className="text-[13px] font-medium">Author</span><input className={`${input} mt-1`} value={p.author} onChange={(e) => set("author", e.target.value)} /></label>
            <label className="block"><span className="text-[13px] font-medium">Tags</span><input className={`${input} mt-1`} placeholder="ACL, Knee, Fellowship" value={tagText} onChange={(e) => setTagText(e.target.value)} /></label>
            {!isNew && <button className="text-[12px] text-sale hover:underline" onClick={() => confirm("Delete this post permanently?") && start(async () => { await deleteArticle(initial.slug); router.push("/admin/blog"); })}>Delete post</button>}
          </div>
        </Card>
      </div>
    </div>
  );
}
