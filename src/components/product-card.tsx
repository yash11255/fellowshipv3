import Image from "next/image";
import Link from "next/link";
import { formatINR, type Product } from "@/lib/catalog";
import { Tag } from "@/components/ui/tag";
import { AddToCart } from "@/components/cart/add-to-cart";
import { Packshot } from "@/components/packshot";

/** Retail product tile: grey tile, centred pack, key active, price, always-visible add to cart. */
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const v = product.variants[0];
  const off = v.compareAt ? Math.round((1 - v.price / v.compareAt) * 100) : 0;
  const active = product.keyActives?.[0];
  const [img1, img2] = product.images;

  return (
    <article className="group flex flex-col">
      <Link href={`/products/${product.handle}`} className="relative block aspect-square overflow-hidden bg-tile">
        {img1 && (product.kind === "single" ? (
          <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 group-hover:opacity-0">
            <Packshot src={img1} alt={product.title} priority={priority} sizes="(min-width:1280px) 14vw, 30vw" className="h-[84%]" />
          </div>
        ) : (
          <Image src={img1} alt={product.title} fill priority={priority}
            sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-contain mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
        ))}
        {img2 && (
          <Image src={img2} alt="" aria-hidden fill sizes="(min-width:1280px) 25vw, (min-width:768px) 33vw, 50vw"
            className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && product.available && <Tag tone="sale">{off}% off</Tag>}
          {product.kind === "pack" && <Tag tone="black">3-in-1 pack</Tag>}
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <Link href={`/products/${product.handle}`} className="text-[15px] font-semibold leading-snug hover:underline">{product.title}</Link>
        <p className="small mt-1 line-clamp-1">
          {active ? `${active.name} ${active.mg}mg` : product.kind === "pack" ? `${product.includes?.length ?? 3} formulas in one pack` : `${product.count ?? ""} ${product.format ?? ""}`}
        </p>
        <p className="mt-2 flex items-baseline gap-2 text-[15px]">
          <span className="font-semibold">{formatINR(v.price)}</span>
          {off > 0 && <span className="text-[13px] text-mute line-through">{formatINR(v.compareAt)}</span>}
        </p>
        <div className="mt-auto pt-3">
          {product.available ? (
            <AddToCart
              line={{ handle: product.handle, title: product.title, image: img1, months: v.months, price: v.price, compareAt: v.compareAt }}
              className="w-full" variant="outline" size="sm"
            />
          ) : (
            <span className="flex h-9 w-full items-center justify-center bg-tile text-[11px] font-semibold uppercase tracking-[0.06em] text-mute">Sold out</span>
          )}
        </div>
      </div>
    </article>
  );
}
