"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { useCart } from "@/components/cart/cart-context";
import { totals, type AppliedDiscount } from "@/lib/pricing";
import { confirmRazorpayPayment, placeOrder, previewDiscount, type PlaceOrderInput } from "@/lib/orders";
import { saveCheckoutDraft } from "@/lib/enquiry-actions";

const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const plan = (m: number) => (m === 0 ? "" : m === 1 ? "1-month supply" : `${m}-month supply`);

type Prefill = { email?: string; phone?: string; address?: PlaceOrderInput["address"] };
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void } } }

function Field({ label, name, error, className, ...rest }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("block", className)}>
      <span className="text-[13px] font-medium">{label}</span>
      <input name={name} aria-invalid={!!error} {...rest}
        className={clsx("mt-1.5 h-12 w-full border px-3 text-[15px] outline-none transition-colors focus:border-black", error ? "border-sale" : "border-line")} />
      {error && <span className="mt-1 block text-[12px] text-sale">{error}</span>}
    </label>
  );
}

export function CheckoutForm({ signedInEmail, prefill, razorpay, recoverLines, recoverToken }: { signedInEmail?: string; prefill?: Prefill; razorpay: boolean; recoverLines?: { handle: string; title: string; months: number; qty: number; price: number; image?: string }[]; recoverToken?: string }) {
  const router = useRouter();
  const { lines, subtotal, savings, clear, settings, add, setOpen } = useCart();
  // abandoned-checkout recovery link: refill the cart once
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !recoverLines?.length || lines.length) return;
    restored.current = true;
    recoverLines.forEach((l) => add({ handle: l.handle, title: l.title, months: l.months, price: l.price, compareAt: 0, image: l.image }, l.qty));
    setOpen(false);
    if (recoverToken) sessionStorage.setItem("rc-draft", recoverToken);
  }, [recoverLines, recoverToken, lines.length, add, setOpen]);
  const [method, setMethod] = useState<"cod" | "razorpay">(razorpay || !settings.codEnabled ? "razorpay" : "cod");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<AppliedDiscount | null>(null);
  const [codeMsg, setCodeMsg] = useState("");
  const [applying, startApply] = useTransition();
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);
  const [pending, start] = useTransition();
  const t = totals(subtotal, method, settings, applied);
  // abandoned-checkout capture: once we have an email + cart, save a draft (debounced by blur)
  const captureDraft = (form: HTMLFormElement | null) => {
    if (!form) return;
    const f = new FormData(form);
    const email = signedInEmail ?? String(f.get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || !lines.length) return;
    const token = sessionStorage.getItem("rc-draft") ?? undefined;
    saveCheckoutDraft({ token, email, phone: String(f.get("phone") ?? ""), name: String(f.get("name") ?? ""), lines: lines.map((l) => ({ handle: l.handle, title: l.title, months: l.months, qty: l.qty, price: l.price, image: l.image })) })
      .then((r) => { if (r.ok && r.token) sessionStorage.setItem("rc-draft", r.token); }).catch(() => {});
  };
  const applyCode = () => startApply(async () => {
    setCodeMsg("");
    const r = await previewDiscount(code, subtotal, signedInEmail);
    if (r.ok) { setApplied({ code: r.code, amount: r.amount, freeShipping: r.freeShipping, label: r.label }); setCode(r.code); }
    else { setApplied(null); setCodeMsg(r.error); }
  });

  if (!lines.length) {
    return (
      <div className="page py-24 text-center">
        <h1 className="hd-1">Your cart is empty</h1>
        <p className="body mt-3">Add a formula to get started.</p>
        <Link href="/shop" className="mt-8 inline-flex h-12 items-center bg-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Shop all</Link>
      </div>
    );
  }

  const fe = (f: string) => (error?.field === f ? error.msg : undefined);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) ?? "").trim();
    const input: PlaceOrderInput = {
      email: signedInEmail ?? g("email"), phone: g("phone"), method, discountCode: applied?.code, draftToken: sessionStorage.getItem("rc-draft") ?? undefined,
      address: { name: g("name"), line1: g("line1"), line2: g("line2"), city: g("city"), state: g("state"), pincode: g("pincode") },
      lines: lines.map((l) => ({ handle: l.handle, months: l.months, qty: l.qty })),
    };
    setError(null);
    start(async () => {
      const r = await placeOrder(input);
      if (!r.ok) {
        if (r.field === "discountCode") { setApplied(null); setCodeMsg(r.error); setError({ msg: r.error }); return; }
        setError({ msg: r.error, field: r.field }); return;
      }
      if (r.kind === "done") { sessionStorage.removeItem("rc-draft"); clear(); router.push(`/order/${r.number}?t=${r.token}`); return; }
      if (!window.Razorpay) { setError({ msg: "Payment window failed to load. Check your connection and try again." }); return; }
      const rzp = new window.Razorpay({
        key: r.keyId, order_id: r.rzpOrderId, amount: r.amount, currency: "INR", name: "Reverse Clinics", description: `Order ${r.number}`,
        prefill: r.prefill, theme: { color: "#000000" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const c = await confirmRazorpayPayment({ number: r.number, orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
          if (c.ok) { clear(); router.push(`/order/${r.number}?t=${c.token}`); } else setError({ msg: c.error });
        },
        modal: { ondismiss: () => setError({ msg: "Payment was cancelled. Your order is saved. You can try again or choose Cash on Delivery." }) },
      });
      rzp.open();
    });
  };

  return (
    <div className="page pb-16 pt-8 md:pt-12">
      {razorpay && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <h1 className="hd-1">Checkout</h1>

      <form onSubmit={onSubmit} onBlur={(e) => captureDraft(e.currentTarget)} noValidate className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <fieldset className="space-y-4">
            <div className="flex items-baseline justify-between">
              <legend className="hd-3">Contact</legend>
              {!signedInEmail && <Link href="/login?next=/checkout" className="text-[13px] underline">Sign in for faster checkout</Link>}
            </div>
            {signedInEmail ? (
              <p className="text-[15px]">Signed in as <span className="font-semibold">{signedInEmail}</span></p>
            ) : (
              <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={prefill?.email} error={fe("email")} />
            )}
            <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile" required defaultValue={prefill?.phone} error={fe("phone")} />
            <p className="small">We&apos;ll send order and delivery updates here.</p>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="hd-3">Delivery address</legend>
            <Field label="Full name" name="name" autoComplete="name" required defaultValue={prefill?.address?.name} error={fe("address.name")} />
            <Field label="House no., building, street" name="line1" autoComplete="address-line1" required defaultValue={prefill?.address?.line1} error={fe("address.line1")} />
            <Field label="Area, landmark (optional)" name="line2" autoComplete="address-line2" defaultValue={prefill?.address?.line2} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" required defaultValue={prefill?.address?.pincode} error={fe("address.pincode")} />
              <Field label="City" name="city" autoComplete="address-level2" required defaultValue={prefill?.address?.city} error={fe("address.city")} />
            </div>
            <label className="block">
              <span className="text-[13px] font-medium">State</span>
              <select name="state" required defaultValue={prefill?.address?.state ?? ""} autoComplete="address-level1"
                className={clsx("mt-1.5 h-12 w-full border bg-white px-3 text-[15px] outline-none focus:border-black", fe("address.state") ? "border-sale" : "border-line")}>
                <option value="" disabled>Select state</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {fe("address.state") && <span className="mt-1 block text-[12px] text-sale">{fe("address.state")}</span>}
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="hd-3">Payment</legend>
            {([
              ["razorpay", "UPI, cards, netbanking & wallets", "Secure payment via Razorpay", !razorpay],
              ["cod", "Cash on Delivery", settings.codFee ? `Pay when it arrives · ${inr(settings.codFee)} COD fee` : "Pay when it arrives", !settings.codEnabled],
            ] as const).map(([v, l, sub, disabled]) => (
              <label key={v} className={clsx("flex cursor-pointer items-center gap-4 border px-4 py-4", method === v ? "border-black" : "border-line", disabled && "cursor-not-allowed opacity-45")}>
                <input type="radio" name="method" value={v} checked={method === v} disabled={disabled} onChange={() => setMethod(v)} className="size-4 accent-black" />
                <span className="flex-1">
                  <span className="block text-[15px] font-semibold">{l}</span>
                  <span className="small">{disabled ? (v === "cod" ? "Not available right now" : "Coming soon") : sub}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-tile p-6 lg:sticky lg:top-32">
            <p className="hd-3">Order summary</p>
            <ul className="mt-5 divide-y divide-line">
              {lines.map((l) => (
                <li key={`${l.handle}-${l.months}`} className="flex gap-4 py-4">
                  <div className="relative size-16 shrink-0 bg-white">
                    {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-contain mix-blend-multiply" />}
                    <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-black text-[11px] font-semibold text-white">{l.qty}</span>
                  </div>
                  <div className="flex-1"><p className="text-[14px] font-semibold leading-snug">{l.title}</p><p className="small">{plan(l.months)}</p></div>
                  <p className="text-[14px] font-semibold">{inr(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              {applied ? (
                <div className="flex items-center justify-between bg-white px-3 py-2.5 text-[14px]">
                  <span><span className="font-semibold">{applied.code}</span> · {applied.label}</span>
                  <button type="button" onClick={() => { setApplied(null); setCode(""); }} className="text-[13px] underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="code" className="sr-only">Discount code</label>
                  <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code) applyCode(); } }}
                    className="h-11 flex-1 border border-line bg-white px-3 text-[14px] uppercase outline-none focus:border-black" />
                  <button type="button" onClick={applyCode} disabled={!code || applying} className="h-11 border border-black bg-white px-4 text-[12px] font-semibold uppercase tracking-[0.06em] disabled:opacity-40">
                    {applying ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {codeMsg && <p role="alert" className="mt-2 text-[13px] text-sale">{codeMsg}</p>}
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(t.subtotal)}</dd></div>
              {t.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount ({applied?.code})</dt><dd>−{inr(t.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{t.shipping ? inr(t.shipping) : "Free"}</dd></div>
              {t.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(t.codFee)}</dd></div>}
              {savings > 0 && <div className="flex justify-between text-ok"><dt>You save</dt><dd>{inr(savings)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-3 text-[17px] font-semibold"><dt>Total</dt><dd>{inr(t.total)}</dd></div>
            </dl>
            {t.shipping > 0 && <p className="small mt-2">Add {inr(settings.freeShippingAt - (t.subtotal - t.discount))} more for free shipping.</p>}
            <p className="small mt-1">Inclusive of all taxes.</p>

            {error && !error.field && <p role="alert" className="mt-4 border border-sale bg-white p-3 text-[13px] text-sale">{error.msg}</p>}
            <button type="submit" disabled={pending}
              className="mt-5 h-14 w-full bg-black text-[13px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-[#262626] disabled:opacity-60">
              {pending ? "Placing order…" : method === "cod" ? `Place order · ${inr(t.total)}` : `Pay ${inr(t.total)}`}
            </button>
            <p className="small mt-3 text-center">By placing your order you agree to our <Link href="/policies/terms" className="underline">terms</Link> and <Link href="/policies/privacy" className="underline">privacy policy</Link>.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
