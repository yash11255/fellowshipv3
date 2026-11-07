import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { ContentEditor } from "@/components/admin/content-editor";

export const metadata = { title: "Edit content" };

export default async function Edit({ searchParams }: PageProps<"/admin/content/edit">) {
  await connection();
  await requireStaff("content");
  const sp = await searchParams;
  const kind = sp.kind === "article" ? "article" : "page";
  const slug = typeof sp.slug === "string" ? sp.slug : null;
  const d = await db();
  let initial = { slug: "", title: "", body: "<p></p>", excerpt: "", image: "", seoTitle: "", seoDescription: "", published: true };
  if (slug) {
    if (kind === "page") {
      const [p] = await d.select().from(schema.pages).where(eq(schema.pages.slug, slug)).limit(1);
      if (!p) notFound();
      initial = { ...initial, slug: p.slug, title: p.title, body: p.body, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", published: p.published };
    } else {
      const [a] = await d.select().from(schema.articles).where(eq(schema.articles.slug, slug)).limit(1);
      if (!a) notFound();
      initial = { slug: a.slug, title: a.title, body: a.body, excerpt: a.excerpt, image: a.image ?? "", seoTitle: a.seoTitle ?? "", seoDescription: a.seoDescription ?? "", published: a.published };
    }
  }
  return (
    <>
      <Link href={`/admin/content${kind === "article" ? "?tab=journal" : ""}`} className="text-[13px] text-grey hover:text-black">← Content</Link>
      <h1 className="mb-6 mt-2 text-[22px] font-semibold tracking-[-0.02em]">{slug ? initial.title : kind === "page" ? "New page" : "New article"}</h1>
      <ContentEditor kind={kind} initial={initial} isNew={!slug} />
    </>
  );
}
