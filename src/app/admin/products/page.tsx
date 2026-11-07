import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, PageHeader, inr, ExportLink } from "@/components/admin/ui";

export const metadata = { title: "Products" };

export default async function Products() {
  await connection();
  await requireStaff();
  const d = await db();
  const ps = await d.select().from(schema.products).orderBy(asc(schema.products.kind), asc(schema.products.title));
  const vs = await d.select().from(schema.variants);

  return (
    <>
      <PageHeader title="Products" sub={`${ps.length} products`} actions={<ExportLink type="products" />} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="text-left text-[12px] text-grey">
              <tr className="border-b border-[#ececec]"><th className="px-4 py-2 font-medium">Product</th><th className="px-4 py-2 font-medium">Status</th><th className="px-4 py-2 font-medium">Type</th><th className="px-4 py-2 font-medium">Availability</th><th className="px-4 py-2 text-right font-medium">From</th></tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {ps.map((p) => {
                const pv = vs.filter((v) => v.productHandle === p.handle);
                const avail = pv.filter((v) => v.available && (v.stock === null || v.stock > 0)).length;
                return (
                  <tr key={p.handle} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${p.handle}`} className="flex items-center gap-3">
                        <span className="relative size-10 shrink-0 rounded-md border border-[#ececec] bg-white">{p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-contain" />}</span>
                        <span className="font-medium hover:underline">{p.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium ${p.status === "active" ? "bg-[#cdfee1] text-[#0c5132]" : "bg-[#ebebeb] text-[#4a4a4a]"}`}>
                        <span aria-hidden>{p.status === "active" ? "●" : "○"}</span>{p.status[0].toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 capitalize text-grey">{p.kind}</td>
                    <td className="px-4 py-2">{avail === 0 ? <span className="font-medium text-sale">Sold out</span> : `${avail} of ${pv.length} variants`}</td>
                    <td className="px-4 py-2 text-right">{pv[0] ? inr(Math.min(...pv.map((v) => v.price))) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
