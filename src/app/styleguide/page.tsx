import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { ProductCard } from "@/components/product-card";
import { CartProvider } from "@/components/cart/cart-context";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

const colors = [
  ["White", "#FFFFFF"], ["Tile", "#F3F3F3"], ["Line", "#E5E5E5"], ["Mute", "#8C8C8C"],
  ["Grey", "#555555"], ["Black", "#000000"], ["Brand", "#FFC31A"], ["Sale", "#C8102E"],
] as const;

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-line py-12 md:grid-cols-[200px_1fr]">
      <p className="label">{title}</p>
      <div>{children}</div>
    </section>
  );
}

export default async function Styleguide() {
  const all = await getProducts();
  const cards = ["collagen-skin-age-rewind", "longevity-pack-reverse-clinics-60", "shilajit-gold", "nmn-supplement-1000mg-anti-aging-cellular-energy-support-reverse-clinics-60"].map((h) => all.find((p) => p.handle === h)).filter((p) => !!p);
  return (
    <CartProvider>
      <main className="page pb-24">
        <header className="flex items-center justify-between py-6"><Logo className="h-8 w-auto" /><p className="label">Design system v2</p></header>
        <Row title="Colour">
          <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
            {colors.map(([n, h]) => (
              <div key={n}><div className="aspect-square border border-line" style={{ background: h }} /><p className="mt-2 text-[13px] font-semibold">{n}</p><p className="small">{h}</p></div>
            ))}
          </div>
        </Row>
        <Row title="Type · Archivo">
          <div className="space-y-6">
            <p className="hd-display">Re-verse your age.</p>
            <p className="hd-1">Shop by concern</p>
            <p className="hd-2">Liposomal NMN with Trans-Resveratrol</p>
            <p className="hd-3">What you&apos;ll notice in 30 days</p>
            <p className="label">Formulated by Dr. Manu Bora</p>
            <p className="body max-w-[64ch]">NMN is a precursor to NAD+, a coenzyme found in every cell. Levels fall with age; supplementing supports cellular energy and repair pathways.</p>
            <p className="small">Taxes included. Free shipping above ₹999.</p>
          </div>
        </Row>
        <Row title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Add to cart</Button><Button variant="outline">Find your stack</Button><Button size="sm">Small</Button>
            <Button variant="link">View all</Button><Button disabled>Sold out</Button>
            <span className="bg-black p-3"><Button variant="white">On black</Button></span>
          </div>
        </Row>
        <Row title="Tags"><div className="flex gap-2"><Tag tone="sale">20% off</Tag><Tag tone="black">3-in-1 pack</Tag><Tag className="border border-line">New</Tag></div></Row>
        <Row title="Product tile">
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 xl:grid-cols-4">{cards.map((p) => <ProductCard key={p.handle} product={p} />)}</div>
        </Row>
      </main>
    </CartProvider>
  );
}
