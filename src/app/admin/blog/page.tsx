import Link from "next/link";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { analyzeSeo, scoreTone } from "@/lib/seo-analyzer";
import { Card, PageHeader, shortDate } from "@/components/admin/ui";

export const metadata = { title: "Blog" };
const now = () => new Date();

export default async function Blog({ searchParams }: PageProps<"/admin/blog">) {
  await connection();
  await requireStaff("content");
  const sp = await searchParams;
  const f = typeof sp.f === "string" ? sp.f : "all";
  const q = typeof sp.q === "string" ? sp.q.toLowerCase() : "";
  const t = now();
  const rows = (await (await db()).select().from(schema.articles).orderBy(desc(schema.articles.publishedAt))).map((a) => {
    const r = analyzeSeo(a);
    const state = !a.published ? "draft" : a.publishedAt > t ? "scheduled" : "published";
    return { ...a, score: r.score, words: r.words, state };
  });
  const shown = rows.filter((a) => (f === "all" || a.state === f || (f === "low" && a.score < 55)) && (!q || a.title.toLowerCase().includes(q)));
  const n = (s: string) => rows.filter((a) => a.state === s).length;
  const tabs: [string, string][] = [["all", `All ${rows.length}`], ["published", `Published ${n("published")}`], ["scheduled", `Scheduled ${n("scheduled")}`], ["draft", `Drafts ${n("draft")}`], ["low", `Low SEO ${rows.filter((a) => a.score < 55).length}`]];
  return (
    <>
      <PageHeader title="Blog" sub="Write, schedule and optimise posts" actions={<Link href="/admin/blog/edit" className="inline-flex h-8 items-center rounded-lg bg-[#303030] px-3 text-[13px] font-medium text-white">New post</Link>} />
      <div className="mb-3 flex flex-wrap items-center gap-1">
        {tabs.map(([k, l]) => <Link key={k} href={`/admin/blog?f=${k}`} className={`rounded-lg px-3 py-1.5 text-[13px] ${f === k ? "bg-[#ebebeb] font-semibold" : "text-[#4a4a4a]"}`}>{l}</Link>)}
        <form className="ml-auto"><input type="hidden" name="f" value={f} /><input name="q" defaultValue={q} placeholder="Search posts" className="h-8 w-48 rounded-lg border border-[#d4d4d4] bg-white px-3 text-[13px]" /></form>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="text-left text-grey"><tr className="border-b border-[#f0f0f0]"><th className="px-4 py-2 font-medium">Post</th><th className="px-4 py-2 font-medium">SEO</th><th className="px-4 py-2 font-medium">Keyword</th><th className="px-4 py-2 font-medium">Words</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 text-right font-medium">Date</th></tr></thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {shown.map((a) => { const tone = scoreTone(a.score); return (
                <tr key={a.slug} className="hover:bg-[#fafafa]">
                  <td className="max-w-[380px] px-4 py-2.5"><Link href={`/admin/blog/edit?slug=${encodeURIComponent(a.slug)}`} className="flex items-center gap-3 font-medium hover:underline">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                    {a.image ? <img src={a.image} alt="" className="size-9 shrink-0 rounded object-cover" /> : <span className="size-9 shrink-0 rounded bg-[#f0f0f0]" />}<span className="truncate">{a.title}</span></Link></td>
                  <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${tone.cls}`}>{a.score}</span></td>
                  <td className="px-4 py-2.5 text-grey">{a.focusKeyword || <span className="text-sale">Not set</span>}</td>
                  <td className="px-4 py-2.5 text-grey">{a.words}</td>
                  <td className="px-4 py-2.5 capitalize">{a.state}</td>
                  <td className="px-4 py-2.5 text-right text-grey">{shortDate(a.publishedAt)}</td>
                </tr>
              ); })}
              {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-grey">No posts here.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
