import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkOrderToken, currentUser } from "@/lib/auth";
import { getTax } from "@/lib/settings";
import { gstIn } from "@/lib/tax";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false } };
const inr = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const STAFF = new Set(["support", "content", "manager", "owner"]);

/** Printable GST tax invoice. Access: signed order link, the order owner, or staff. Browser "Save as PDF" produces the PDF. */
async function Invoice({ params, searchParams }: { params: PageProps<"/invoice/[number]">["params"]; searchParams: PageProps<"/invoice/[number]">["searchParams"] }) {
  await connection();
  const { number } = await params;
  const sp = await searchParams;
  const d = await db();
  const [o] = await d.select().from(schema.orders).where(eq(schema.orders.number, number)).limit(1);
  if (!o) notFound();
  const user = await currentUser();
  const ok = checkOrderToken(number, typeof sp.t === "string" ? sp.t : undefined) || (user && (o.userId === user.id || STAFF.has(user.role)));
  if (!ok || o.status === "pending_payment") notFound();
  const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
  const tax = await getTax();
  const a = o.shippingAddress;
  const intra = !o.taxSplit?.igst;
  const ratio = o.subtotal ? (o.subtotal - o.discount) / o.subtotal : 1;
  const lines = items.map((it) => {
    const gross = Math.round(it.price * it.qty * ratio);
    const t = gstIn(gross, it.taxRate);
    return { ...it, gross, taxable: gross - t, tax: t };
  });
  const feeGross = o.shipping + o.codFee;
  const feeRate = Math.max(0, ...items.map((i) => i.taxRate));
  const feeTax = o.taxTotal - lines.reduce((s, l) => s + l.tax, 0);

  return (
    <div className="mx-auto max-w-[820px] bg-white p-8 text-[12px] leading-relaxed text-black print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[13px] text-grey">Use Print → Save as PDF to download.</p>
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b border-black pb-4">
        <div>
          <Image src="/brand/logo-black.png" alt="Reverse Clinics" width={140} height={50} />
          <p className="mt-2 font-semibold">{tax.legalName}</p>
          <p>State: {tax.businessState}</p>
          {tax.gstin ? <p>GSTIN: {tax.gstin}</p> : <p className="text-sale print:hidden">GSTIN not set (Admin → Settings → Taxes)</p>}
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold uppercase tracking-[0.04em]">Tax invoice</p>
          <p>Invoice no: INV-{o.number.replace("RC-", "")}</p>
          <p>Order: {o.number}</p>
          <p>Date: {o.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
          <p>Payment: {o.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)"}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 border-b border-black py-4">
        <div><p className="font-semibold uppercase">Bill to / Ship to</p><p>{a.name}</p><p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p><p>{a.city}, {a.state} {a.pincode}</p><p>{a.phone} · {o.email}</p></div>
        <div className="text-right"><p className="font-semibold uppercase">Place of supply</p><p>{a.state}</p><p>{intra ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</p></div>
      </section>
      <table className="mt-4 w-full border-collapse">
        <thead><tr className="border-b border-black text-left">
          <th className="py-1.5">Item</th><th>HSN</th><th className="text-right">Qty</th><th className="text-right">Taxable ₹</th><th className="text-right">GST %</th>
          {intra ? <><th className="text-right">CGST ₹</th><th className="text-right">SGST ₹</th></> : <th className="text-right">IGST ₹</th>}<th className="text-right">Total ₹</th>
        </tr></thead>
        <tbody>
          {lines.map((l) => (
            <tr key={`${l.productHandle}-${l.months}`} className="border-b border-[#ddd]">
              <td className="py-1.5">{l.title}{l.months ? ` (${l.months}-month)` : ""}</td><td>{l.hsn ?? "—"}</td><td className="text-right">{l.qty}</td>
              <td className="text-right">{inr(l.taxable)}</td><td className="text-right">{l.taxRate}</td>
              {intra ? <><td className="text-right">{inr(l.tax / 2)}</td><td className="text-right">{inr(l.tax / 2)}</td></> : <td className="text-right">{inr(l.tax)}</td>}
              <td className="text-right">{inr(l.gross)}</td>
            </tr>
          ))}
          {feeGross > 0 && (
            <tr className="border-b border-[#ddd]">
              <td className="py-1.5">Shipping & handling{o.codFee ? " (incl. COD fee)" : ""}</td><td>996812</td><td className="text-right">1</td>
              <td className="text-right">{inr(feeGross - feeTax)}</td><td className="text-right">{feeRate}</td>
              {intra ? <><td className="text-right">{inr(feeTax / 2)}</td><td className="text-right">{inr(feeTax / 2)}</td></> : <td className="text-right">{inr(feeTax)}</td>}
              <td className="text-right">{inr(feeGross)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="ml-auto mt-4 w-64 space-y-1">
        {o.discount > 0 && <p className="flex justify-between"><span>Discount applied{o.discountCode ? ` (${o.discountCode})` : ""}</span><span>−{inr(o.discount)}</span></p>}
        <p className="flex justify-between"><span>Taxable value</span><span>{inr(o.total - o.taxTotal)}</span></p>
        {intra ? <><p className="flex justify-between"><span>CGST</span><span>{inr(o.taxSplit?.cgst ?? 0)}</span></p><p className="flex justify-between"><span>SGST</span><span>{inr(o.taxSplit?.sgst ?? 0)}</span></p></>
          : <p className="flex justify-between"><span>IGST</span><span>{inr(o.taxSplit?.igst ?? 0)}</span></p>}
        <p className="flex justify-between border-t border-black pt-1 text-[14px] font-semibold"><span>Total</span><span>₹{inr(o.total)}</span></p>
      </div>
      <footer className="mt-10 border-t border-[#ddd] pt-3 text-[11px] text-grey">
        <p>This is a computer-generated invoice and does not require a signature. Nutraceutical products. Not intended to diagnose, treat, cure or prevent any disease.</p>
      </footer>
    </div>
  );
}

export default function Page(props: PageProps<"/invoice/[number]">) {
  return <Suspense fallback={null}><Invoice params={props.params} searchParams={props.searchParams} /></Suspense>;
}
