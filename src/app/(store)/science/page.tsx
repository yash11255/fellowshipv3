import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "The science", description: "Every active ingredient and dose in Reverse Clinics formulas, disclosed. No proprietary blends.", alternates: { canonical: "/science" } };

export default async function Science() {
  const ps = (await getProducts()).filter((p) => p.kind === "single" && p.keyActives?.length);
  return (
    <div className="page pt-8 md:pt-12">
      <h1 className="hd-1">The science</h1>
      <p className="body mt-3 max-w-[64ch] text-[16px]">We publish every key active and its dose. No proprietary blends, no hidden fillers. Formulas are designed by Dr. Manu Bora around how ingredients work together, and manufactured in GMP-certified, lab-tested facilities.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[["Every dose disclosed", "Each active is listed in milligrams on the label and on this site."], ["Doctor-formulated", "Stacks are designed around ingredient interactions by a practising surgeon."], ["Tested batches", "GMP-certified manufacturing; batches lab-tested for purity."]].map(([t, d]) => (
          <div key={t} className="bg-tile p-6"><p className="hd-3">{t}</p><p className="small mt-2">{d}</p></div>
        ))}
      </div>
      <h2 className="hd-2 mt-16">Key actives by formula</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-[14px]">
          <thead className="text-left text-[12px] uppercase tracking-[0.06em] text-grey"><tr className="border-b border-black"><th className="py-3">Formula</th><th>Active</th><th className="text-right">Dose / serving</th></tr></thead>
          <tbody>
            {ps.flatMap((p) => p.keyActives!.map((a, i) => (
              <tr key={p.handle + a.name} className="border-b border-line">
                <td className="py-3 pr-4">{i === 0 && <Link href={`/products/${p.handle}`} className="font-semibold hover:underline">{p.title}</Link>}</td>
                <td>{a.name}</td><td className="text-right font-semibold">{a.mg} mg</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <p className="small mt-4">Full supplement facts are on each product page. Information only, not medical advice.</p>
    </div>
  );
}
