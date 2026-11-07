import Link from "next/link";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { getSeo } from "@/lib/settings";
import { getAllPrograms } from "@/lib/program-store";
import { analyzeSeo, scoreTone } from "@/lib/seo-analyzer";
import { Card, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "SEO" };
const YEAR = 365 * 86_400_000;
const ageMs = (d: Date) => Date.now() - d.getTime();

type Issue = { level: "high" | "medium" | "low"; text: string; fix: string; href: string };

function List({ id, title, rows }: { id: string; title: string; rows: { slug: string; title: string; extra?: string }[] }) {
  return rows.length ? (
    <Card title={`${title} (${rows.length})`} className="scroll-mt-4" ><div id={id} />
      <ul className="max-h-72 divide-y divide-[#f0f0f0] overflow-y-auto">{rows.map((r) => <li key={r.slug + (r.extra ?? "")}><Link href={`/admin/blog/edit?slug=${r.slug}`} className="flex justify-between gap-3 px-4 py-2 text-[13px] hover:bg-[#fafafa]"><span className="truncate">{r.title}</span>{r.extra && <span className="shrink-0 text-grey">{r.extra}</span>}</Link></li>)}</ul>
    </Card>
  ) : null;
}

export default async function Seo() {
  await connection();
  await requireStaff("content");
  const d = await db();
  const seo = await getSeo();
  const posts = await d.select().from(schema.articles).where(eq(schema.articles.published, true)).orderBy(desc(schema.articles.publishedAt));
  const pages = await d.select().from(schema.pages);
  const programs = (await getAllPrograms()).filter((p) => p.published);

  const scored = posts.map((a) => ({ a, r: analyzeSeo(a) }));
  const avg = scored.length ? Math.round(scored.reduce((s, x) => s + x.r.score, 0) / scored.length) : 0;
  const noDesc = posts.filter((a) => !a.seoDescription);
  const noKw = posts.filter((a) => !a.focusKeyword);
  const noImg = posts.filter((a) => !a.image);
  const thin = scored.filter((x) => x.r.words < 400);
  const stale = posts.filter((a) => ageMs(a.updatedAt) > YEAR);
  const titles = new Map<string, string[]>();
  for (const a of posts) { const t = (a.seoTitle || a.title).toLowerCase().trim(); titles.set(t, [...(titles.get(t) ?? []), a.slug]); }
  const dupTitles = [...titles].filter(([, s]) => s.length > 1);
  const kws = new Map<string, string[]>();
  for (const a of posts) if (a.focusKeyword) { const k = a.focusKeyword.toLowerCase().trim(); kws.set(k, [...(kws.get(k) ?? []), a.slug]); }
  const cannibal = [...kws].filter(([, s]) => s.length > 1);
  // Orphans: posts no other post or programme links to.
  const linked = new Set<string>();
  for (const a of posts) for (const m of a.body.matchAll(/href="(?:https?:\/\/(?:www\.)?arthroscopycollege\.com)?\/journal\/([a-z0-9-]+)/g)) if (m[1] !== a.slug) linked.add(m[1]);
  const orphans = posts.filter((a) => !linked.has(a.slug));

  const issues: Issue[] = [];
  if (!seo.allowIndexing) issues.push({ level: "high", text: "Search engines are blocked from the whole site.", fix: "Turn on indexing", href: "/admin/settings/seo" });
  if (!seo.gscVerification) issues.push({ level: "high", text: "Google Search Console isn't verified.", fix: "Add verification code", href: "/admin/settings/seo" });
  if (!seo.ga4Id) issues.push({ level: "medium", text: "Google Analytics (GA4) isn't connected, so you can't see search traffic.", fix: "Add GA4 ID", href: "/admin/settings/seo" });
  if (seo.ogImage.endsWith("logo.jpg")) issues.push({ level: "low", text: "The default social share image is the small logo.", fix: "Set a 1200×630 image", href: "/admin/settings/seo" });
  if (noDesc.length) issues.push({ level: "high", text: `${noDesc.length} posts have no meta description.`, fix: "Write descriptions", href: "/admin/blog?f=low" });
  if (noKw.length) issues.push({ level: "medium", text: `${noKw.length} posts have no focus keyword.`, fix: "Set keywords", href: "/admin/blog" });
  if (dupTitles.length) issues.push({ level: "medium", text: `${dupTitles.length} titles are used by more than one post.`, fix: "Make titles unique", href: "#duplicates" });
  if (cannibal.length) issues.push({ level: "medium", text: `${cannibal.length} focus keywords are targeted by several posts (they compete with each other).`, fix: "Review", href: "#cannibal" });
  if (thin.length) issues.push({ level: "low", text: `${thin.length} posts are under 400 words.`, fix: "Expand", href: "#thin" });
  if (noImg.length) issues.push({ level: "low", text: `${noImg.length} posts have no cover image.`, fix: "Add images", href: "/admin/blog" });
  if (orphans.length) issues.push({ level: "low", text: `${orphans.length} posts aren't linked from any other post.`, fix: "Add internal links", href: "#orphans" });
  if (stale.length) issues.push({ level: "low", text: `${stale.length} posts haven't been updated in over a year.`, fix: "Refresh", href: "#stale" });

  const health = Math.max(0, 100 - issues.reduce((s, i) => s + (i.level === "high" ? 15 : i.level === "medium" ? 7 : 3), 0));
  const tone = scoreTone(health); const pTone = scoreTone(avg);
  const worst = [...scored].sort((x, y) => x.r.score - y.r.score).slice(0, 10);
  const base = seo.siteUrl.replace(/\/$/, "");

  return (
    <>
      <PageHeader title="SEO" sub="Search health across the site" actions={<Link href="/admin/settings/seo" className="inline-flex h-8 items-center rounded-lg border border-[#d4d4d4] bg-white px-3 text-[13px] font-medium">SEO settings</Link>} />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Card className="p-4"><p className="text-[13px] text-grey">Site health</p><p className="mt-1 text-[26px] font-semibold">{health}<span className="text-[15px] text-grey">/100</span></p><span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${tone.cls}`}>{tone.label}</span></Card>
        <Card className="p-4"><p className="text-[13px] text-grey">Average post SEO score</p><p className="mt-1 text-[26px] font-semibold">{avg}<span className="text-[15px] text-grey">/100</span></p><span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${pTone.cls}`}>{pTone.label}</span></Card>
        <Card className="p-4"><p className="text-[13px] text-grey">Indexable pages</p><p className="mt-1 text-[26px] font-semibold">{posts.length + pages.length + programs.length + 7}</p><p className="text-[12px] text-mute">{posts.length} posts · {programs.length} programmes · {pages.length} pages</p></Card>
        <Card className="p-4"><p className="text-[13px] text-grey">Indexing</p><p className={`mt-1 text-[20px] font-semibold ${seo.allowIndexing ? "text-[#0c5132]" : "text-sale"}`}>{seo.allowIndexing ? "Open to Google" : "Blocked"}</p><p className="text-[12px] text-mute">robots.txt + sitemap.xml</p></Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title={`To fix (${issues.length})`} className="xl:col-span-2">
          <ul className="divide-y divide-[#f0f0f0]">
            {issues.map((i) => (
              <li key={i.text} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                <span className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold uppercase ${i.level === "high" ? "bg-[#fee3e1] text-[#8e1f0b]" : i.level === "medium" ? "bg-[#fff1d6] text-[#5e4200]" : "bg-[#ebebeb] text-[#4a4a4a]"}`}>{i.level}</span>
                <span className="flex-1">{i.text}</span>
                <Link href={i.href} className="shrink-0 text-[#005bd3] hover:underline">{i.fix} →</Link>
              </li>
            ))}
            {issues.length === 0 && <li className="p-4 text-[13px] text-grey">Nothing to fix. Nice work.</li>}
          </ul>
        </Card>
        <Card title="Technical">
          <ul className="divide-y divide-[#f0f0f0] text-[13px]">
            {[["Sitemap", "/sitemap.xml", true], ["Robots.txt", "/robots.txt", true], ["Canonical URLs", "On every page", true], ["Structured data", "Organization, Course, Article, Physician", true], ["Open Graph / social cards", "Title, description, image", true], ["Old WordPress URLs", "301-redirected", true], ["Search Console", seo.gscVerification ? "Verified" : "Not set", !!seo.gscVerification], ["Google Analytics", seo.ga4Id || "Not set", !!seo.ga4Id]].map(([k, v, ok]) => (
              <li key={k as string} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex items-center gap-2"><span aria-hidden className={`size-2 rounded-full ${ok ? "bg-[#14a44d]" : "bg-[#d4351c]"}`} />{k as string}</span>
                {(v as string).startsWith("/") ? <a href={v as string} target="_blank" rel="noreferrer" className="text-[#005bd3] hover:underline">{v as string} ↗</a> : <span className="text-right text-grey">{v as string}</span>}
              </li>
            ))}
          </ul>
          <div className="border-t border-[#f0f0f0] p-4 text-[12px] text-grey">
            Submit <span className="font-mono text-black">{base}/sitemap.xml</span> in Google Search Console after launch.
            <div className="mt-2 flex flex-wrap gap-3"><a className="text-[#005bd3] hover:underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console ↗</a><a className="text-[#005bd3] hover:underline" href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(base)}`} target="_blank" rel="noreferrer">PageSpeed ↗</a><a className="text-[#005bd3] hover:underline" href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(base)}`} target="_blank" rel="noreferrer">Rich results test ↗</a></div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Lowest-scoring posts" action={<Link href="/admin/blog?f=low" className="text-[13px] text-[#005bd3] hover:underline">All</Link>}>
          <ul className="divide-y divide-[#f0f0f0]">
            {worst.map(({ a, r }) => { const t = scoreTone(r.score); const top = r.checks.find((c) => c.status === "bad"); return (
              <li key={a.slug}><Link href={`/admin/blog/edit?slug=${a.slug}`} className="flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[#fafafa]">
                <span className={`w-10 shrink-0 rounded-full py-0.5 text-center text-[12px] font-semibold ${t.cls}`}>{r.score}</span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{a.title}</span>{top && <span className="block truncate text-[12px] text-grey">Fix: {top.label}</span>}</span>
              </Link></li>
            ); })}
          </ul>
        </Card>
        <Card title="Programme pages">
          <ul className="divide-y divide-[#f0f0f0]">
            {programs.map((p) => { const len = p.title.length + 23; const dl = p.short.length; const ok = len <= 65 && dl >= 70 && dl <= 170; return (
              <li key={p.slug}><Link href={`/admin/programs/edit?slug=${p.slug}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px] hover:bg-[#fafafa]">
                <span className="flex min-w-0 items-center gap-2"><span aria-hidden className={`size-2 shrink-0 rounded-full ${ok ? "bg-[#14a44d]" : "bg-[#e0a100]"}`} /><span className="truncate">{p.title}</span></span>
                <span className="shrink-0 text-grey">title {len} · desc {dl}</span>
              </Link></li>
            ); })}
          </ul>
          <p className="border-t border-[#f0f0f0] px-4 py-2 text-[12px] text-grey">Programme pages use the name as the title and the short description as the meta description. Keep descriptions 70–170 characters.</p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {cannibal.length > 0 && <Card title={`Keyword overlap (${cannibal.length})`}><div id="cannibal" /><ul className="divide-y divide-[#f0f0f0]">{cannibal.map(([k, s]) => <li key={k} className="px-4 py-2.5 text-[13px]"><span className="font-medium">“{k}”</span><span className="block text-grey">{s.map((x) => <Link key={x} href={`/admin/blog/edit?slug=${x}`} className="mr-3 text-[#005bd3] hover:underline">/{x}</Link>)}</span></li>)}</ul></Card>}
        {dupTitles.length > 0 && <Card title={`Duplicate titles (${dupTitles.length})`}><div id="duplicates" /><ul className="divide-y divide-[#f0f0f0]">{dupTitles.map(([t, s]) => <li key={t} className="px-4 py-2.5 text-[13px]"><span className="font-medium">{t}</span><span className="block">{s.map((x) => <Link key={x} href={`/admin/blog/edit?slug=${x}`} className="mr-3 text-[#005bd3] hover:underline">/{x}</Link>)}</span></li>)}</ul></Card>}
        <List id="thin" title="Thin posts (under 400 words)" rows={thin.map(({ a, r }) => ({ slug: a.slug, title: a.title, extra: `${r.words} words` }))} />
        <List id="orphans" title="Not linked from other posts" rows={orphans.map((a) => ({ slug: a.slug, title: a.title }))} />
        <List id="stale" title="Not updated in a year" rows={stale.map((a) => ({ slug: a.slug, title: a.title, extra: a.updatedAt.toLocaleDateString("en-IN") }))} />
      </div>
    </>
  );
}
