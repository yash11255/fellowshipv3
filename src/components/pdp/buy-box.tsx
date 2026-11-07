"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useCart } from "@/components/cart/cart-context";
import type { Variant } from "@/lib/catalog";

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const label = (m: number) => (m === 1 ? "1 month" : `${m} months`);

export function BuyBox({ handle, title, image, variants, available }: {
  handle: string; title: string; image?: string; variants: Variant[]; available: boolean;
}) {
  const { add } = useCart();
  const firstAvail = Math.max(0, variants.findIndex((v) => v.available !== false));
  const [sel, setSel] = useState(variants.length > 1 ? Math.min(1, variants.length - 1) : firstAvail);
  const [qty, setQty] = useState(1);
  const [showSticky, setShowSticky] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const v = variants[sel];
  const base = variants[0];
  const canBuy = available && v.available !== false;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onAdd = () => add({ handle, title, image, months: v.months, price: v.price, compareAt: v.compareAt }, qty);

  return (
    <div>
      {variants.length > 1 && (
        <fieldset>
          <legend className="label">Choose your supply</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {variants.map((x, k) => {
              const perMonth = Math.round(x.price / Math.max(1, x.months));
              const save = base.price ? Math.round((1 - perMonth / base.price) * 100) : 0;
              const disabled = x.available === false;
              return (
                <label key={x.months} className={clsx("relative flex cursor-pointer flex-col border p-3 transition-colors",
                  sel === k ? "border-black bg-black text-white" : "border-line hover:border-black",
                  disabled && "pointer-events-none opacity-40")}>
                  <input type="radio" name="supply" className="sr-only" checked={sel === k} onChange={() => setSel(k)} disabled={disabled} />
                  {x.months === 3 && <span className="absolute -top-2.5 left-3 bg-brand px-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-black">Popular</span>}
                  <span className="text-[14px] font-semibold">{label(x.months)}</span>
                  <span className={clsx("text-[13px]", sel === k ? "text-white/80" : "text-grey")}>{inr(perMonth)}/mo</span>
                  <span className={clsx("mt-1 text-[12px] font-semibold", save > 0 ? (sel === k ? "text-brand" : "text-ok") : "invisible")}>Save {save}%</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-[26px] font-semibold tracking-[-0.02em]">{inr(v.price)}</span>
        {v.compareAt > v.price && <span className="text-[15px] text-mute line-through">{inr(v.compareAt)}</span>}
        {v.compareAt > v.price && <span className="text-[13px] font-semibold text-sale">{Math.round((1 - v.price / v.compareAt) * 100)}% off</span>}
      </div>
      <p className="small">Inclusive of all taxes</p>

      <div className="mt-5 flex gap-2">
        <div className="flex h-13 items-center border border-line">
          <button className="h-full w-11 text-[18px] text-grey hover:text-black" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
          <span className="w-8 text-center text-[15px]" aria-live="polite">{qty}</span>
          <button className="h-full w-11 text-[18px] text-grey hover:text-black" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">+</button>
        </div>
        <button ref={ref} onClick={onAdd} disabled={!canBuy}
          className="h-13 flex-1 bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626] disabled:bg-tile disabled:text-mute">
          {canBuy ? "Add to cart" : "Sold out"}
        </button>
      </div>
      {!canBuy && (
        <p className="small mt-3">Back soon. <a href="#" className="text-black underline">Notify me</a> when it&apos;s in stock.</p>
      )}

      {/* mobile sticky add-to-cart */}
      <div className={clsx("fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white px-4 py-3 transition-transform duration-300 md:hidden",
        showSticky ? "translate-y-0" : "translate-y-full")}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold">{title}</p>
          <p className="text-[13px] text-grey">{label(v.months)} · {inr(v.price)}</p>
        </div>
        <button onClick={onAdd} disabled={!canBuy} className="h-11 bg-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white disabled:bg-tile disabled:text-mute">
          {canBuy ? "Add" : "Sold out"}
        </button>
      </div>
    </div>
  );
}
