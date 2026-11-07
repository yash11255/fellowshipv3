"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useCart } from "./cart-context";

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const plan = (m: number) => (m === 0 ? "" : m === 1 ? "1-month supply" : `${m}-month supply`);

export function CartDrawer() {
  const { open, setOpen, lines, update, subtotal, savings, count, settings } = useCart();
  const FREE_SHIPPING_AT = settings.freeShippingAt;
  const remaining = Math.max(0, FREE_SHIPPING_AT - subtotal);
  const progress = Math.min(1, subtotal / FREE_SHIPPING_AT);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim" className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="panel" role="dialog" aria-modal="true" aria-label="Cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-white"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <p className="text-[15px] font-medium">Cart <span className="text-mute">({count})</span></p>
              <button onClick={() => setOpen(false)} className="label hover:underline" autoFocus>Close</button>
            </header>

            <div className="border-b border-line px-6 py-4">
              <p className="text-[13px] text-grey">
                {remaining > 0 ? <>You&apos;re <span className="text-black">{inr(remaining)}</span> away from free shipping</> : "Free shipping unlocked"}
              </p>
              <div className="mt-2 h-[2px] bg-line">
                <motion.div className="h-full bg-black" initial={false} animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-start justify-center gap-4">
                  <p className="hd-2">Your cart is empty.</p>
                  <p className="body">Not sure where to begin? Start with a doctor-designed stack.</p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {lines.map((l) => (
                    <li key={`${l.handle}-${l.months}`} className="flex gap-4 py-5">
                      <div className="relative size-24 shrink-0 overflow-hidden bg-tile">
                        {l.image && <Image src={l.image} alt="" fill sizes="96px" className="object-contain mix-blend-multiply" />}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <p className="text-[14px] font-medium leading-snug">{l.title}</p>
                          <p className="text-[14px]">{inr(l.price * l.qty)}</p>
                        </div>
                        <p className="small">{plan(l.months)}</p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex h-8 items-center border border-line">
                            <button className="w-8 text-grey hover:text-black" aria-label="Decrease" onClick={() => update(l.handle, l.months, l.qty - 1)}>−</button>
                            <span className="w-6 text-center text-[13px]">{l.qty}</span>
                            <button className="w-8 text-grey hover:text-black" aria-label="Increase" onClick={() => update(l.handle, l.months, l.qty + 1)}>+</button>
                          </div>
                          <button className="small underline-offset-4 hover:underline" onClick={() => update(l.handle, l.months, 0)}>Remove</button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-line px-6 py-5">
                {savings > 0 && (
                  <div className="flex justify-between text-[13px] text-ok"><span>You save</span><span >{inr(savings)}</span></div>
                )}
                <div className="mt-1 flex justify-between text-[15px] font-medium"><span>Subtotal</span><span >{inr(subtotal)}</span></div>
                <p className="small mt-1">Taxes included. Shipping calculated at checkout.</p>
                <Link href="/checkout" onClick={() => setOpen(false)} className="mt-4 flex h-14 w-full items-center justify-center bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626]">
                  Checkout
                </Link>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
