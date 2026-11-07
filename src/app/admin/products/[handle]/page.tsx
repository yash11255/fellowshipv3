import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { getSeo, getTax } from "@/lib/settings";

async function Edit({ params }: { params: PageProps<"/admin/products/[handle]">["params"] }) {
  await requireStaff();
  const { handle } = await params;
  const d = await db();
  const [p] = await d.select().from(schema.products).where(eq(schema.products.handle, handle)).limit(1);
  if (!p) notFound();
  const vs = await d.select().from(schema.variants).where(eq(schema.variants.productHandle, handle)).orderBy(asc(schema.variants.months));

  return (
    <>
      <Link href="/admin/products" className="text-[13px] text-grey hover:text-black">← Products</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{p.title}</h1>
        <Link href={`/products/${p.handle}`} target="_blank" className="text-[13px] text-[#005bd3] hover:underline">View on store ↗</Link>
      </div>
      <ProductEditor handle={handle} siteUrl={(await getSeo()).siteUrl} slabs={(await getTax()).slabs} initial={{
        title: p.title, description: p.description, status: p.status, seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", taxSlab: p.taxSlab, hsn: p.hsn ?? "",
        variants: vs.map((v) => ({ id: v.id, months: v.months, price: v.price, compareAt: v.compareAt, available: v.available, stock: v.stock, sku: v.sku })),
      }} />
      <Card title={`Media (${p.images.length})`} className="mt-4">
        <ul className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6 lg:grid-cols-10">
          {p.images.map((src) => (
            <li key={src} className="relative aspect-square rounded-md border border-[#ececec] bg-white"><Image src={src} alt="" fill sizes="96px" className="object-contain" /></li>
          ))}
        </ul>
        <p className="px-4 pb-3 text-[12px] text-grey">Upload, reorder and delete arrive with media storage (Cloudinary/R2).</p>
      </Card>
    </>
  );
}

export default function Page({ params }: PageProps<"/admin/products/[handle]">) {
  return <Suspense fallback={<div className="h-64" aria-busy />}><Edit params={params} /></Suspense>;
}
