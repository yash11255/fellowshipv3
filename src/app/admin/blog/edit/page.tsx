import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { getSeo } from "@/lib/settings";
import { BlogEditor, type PostDraft } from "@/components/admin/blog-editor";

export const metadata = { title: "Edit post" };
const localNow = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const toLocal = (d: Date) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };

export default async function EditPost({ searchParams }: PageProps<"/admin/blog/edit">) {
  await connection();
  await requireStaff("content");
  const slug = typeof (await searchParams).slug === "string" ? String((await searchParams).slug) : null;
  const d = await db();
  let initial: PostDraft = { slug: "", title: "", body: "<p></p>", excerpt: "", image: "", author: "Dr. Manu Bora", tags: [], focusKeyword: "", seoTitle: "", seoDescription: "", published: false, publishedAt: localNow() };
  if (slug) {
    const [a] = await d.select().from(schema.articles).where(eq(schema.articles.slug, slug)).limit(1);
    if (!a) notFound();
    initial = { slug: a.slug, title: a.title, body: a.body, excerpt: a.excerpt, image: a.image ?? "", author: a.author, tags: a.tags, focusKeyword: a.focusKeyword ?? "", seoTitle: a.seoTitle ?? "", seoDescription: a.seoDescription ?? "", published: a.published, publishedAt: toLocal(a.publishedAt) };
  }
  const related = (await d.select({ slug: schema.articles.slug, title: schema.articles.title }).from(schema.articles).orderBy(desc(schema.articles.publishedAt)).limit(12)).filter((r) => r.slug !== slug).slice(0, 8);
  const { siteUrl } = await getSeo();
  return (
    <>
      <Link href="/admin/blog" className="text-[13px] text-grey hover:text-black">← Blog</Link>
      <h1 className="mb-4 mt-2 text-[22px] font-semibold tracking-[-0.02em]">{slug ? "Edit post" : "New post"}</h1>
      <BlogEditor initial={initial} isNew={!slug} siteUrl={siteUrl} related={related} />
    </>
  );
}
