import Link from "next/link";
import { connection } from "next/server";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, shortDate } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function Content({ searchParams }: PageProps<"/admin/content">) {
  await connection();
  await requireStaff("content");
  const tab = "pages" as "pages" | "journal"; void searchParams;
  const d = await db();
  const rows = tab === "pages"
    ? (await d.select().from(schema.pages).orderBy(asc(schema.pages.slug))).map((p) => ({ slug: p.slug, title: p.title, published: p.published, date: p.updatedAt, href: `/${p.slug}` }))
    : (await d.select().from(schema.articles).orderBy(desc(schema.articles.publishedAt))).map((a) => ({ slug: a.slug, title: a.title, published: a.published, date: a.publishedAt, href: `/journal/${a.slug}` }));
  const kind = tab === "pages" ? "page" : "article";
  return (
    <>
      <PageHeader title="Pages" sub="Legal pages and other standalone pages. Blog posts live under Blog."
        actions={<Link href={`/admin/content/edit?kind=${kind}`} className="inline-flex h-8 items-center rounded-lg bg-[#303030] px-3 text-[13px] font-medium text-white">{tab === "pages" ? "New page" : "New article"}</Link>} />
      <Card>
        <ul className="divide-y divide-[#f0f0f0]">
          {rows.map((r) => (
            <li key={r.slug}><Link href={`/admin/content/edit?kind=${kind}&slug=${encodeURIComponent(r.slug)}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[13px] hover:bg-[#fafafa]">
              <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
              <span className="font-mono text-[12px] text-grey">{r.href}</span>
              <span className={`rounded-full px-2 py-0.5 text-[12px] ${r.published ? "bg-[#cdfee1] text-[#0c5132]" : "bg-[#ebebeb] text-[#4a4a4a]"}`}>{r.published ? "● Published" : "○ Hidden"}</span>
              <span className="w-20 text-right text-grey">{shortDate(r.date)}</span>
            </Link></li>
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-grey">Nothing here yet.</li>}
        </ul>
      </Card>
    </>
  );
}
