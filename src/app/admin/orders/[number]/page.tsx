import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireStaff } from "@/lib/admin";
import { Card, StatusBadge, dateTime, inr } from "@/components/admin/ui";
import { OrderActions } from "@/components/admin/order-actions";
import { shippingConfig } from "@/lib/integrations";

async function Detail({ params }: { params: PageProps<"/admin/orders/[number]">["params"] }) {
  await requireStaff();
  const { number } = await params;
  const d = await db();
  const [o] = await d.select().from(schema.orders).where(eq(schema.orders.number, number)).limit(1);
  if (!o) notFound();
  const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
  const prior = o.userId ? (await d.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.userId, o.userId))).length : 1;
  const a = o.shippingAddress;
  const ship = await shippingConfig();
  const defaultProvider = o.paymentMethod === "cod" ? ship.codProvider : ship.prepaidProvider;

  return (
    <>
      <Link href="/admin/orders" className="text-[13px] text-grey hover:text-black">← Orders</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{o.number}</h1>
        <StatusBadge status={o.status} />
        {o.status !== "pending_payment" && <Link href={`/invoice/${o.number}`} target="_blank" className="ml-auto rounded-lg border border-[#d4d4d4] bg-white px-3 py-1.5 text-[13px] font-medium hover:bg-[#f7f7f7]">Invoice ↗</Link>}
        <span className="text-[13px] text-grey">{dateTime(o.createdAt)} · {o.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title={`Items (${items.reduce((s, i) => s + i.qty, 0)})`}>
            <ul className="divide-y divide-[#f0f0f0]">
              {items.map((it) => (
                <li key={`${it.productHandle}-${it.months}`} className="flex items-center gap-3 px-4 py-3 text-[13px]">
                  <div className="relative size-12 shrink-0 rounded-md border border-[#ececec] bg-white">{it.image && <Image src={it.image} alt="" fill sizes="48px" className="object-contain" />}</div>
                  <div className="flex-1">
                    <Link href={`/admin/products/${it.productHandle}`} className="font-medium hover:underline">{it.title}</Link>
                    <p className="text-grey">{it.months ? `${it.months}-month supply` : "—"}</p>
                  </div>
                  <span className="text-grey">{it.taxRate ? `GST ${it.taxRate}% · ` : ""}{inr(it.price)} × {it.qty}</span>
                  <span className="w-20 text-right font-medium">{inr(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Payment">
            <dl className="space-y-1.5 p-4 text-[13px]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount {o.discountCode ? `(${o.discountCode})` : ""}</dt><dd>−{inr(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
              {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
              <div className="flex justify-between border-t border-[#f0f0f0] pt-2 font-semibold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
              {o.taxTotal > 0 && (
                <div className="flex justify-between text-grey"><dt>Includes GST</dt>
                  <dd>{o.taxSplit?.igst ? `IGST ${inr(o.taxSplit.igst)}` : `CGST ${inr(o.taxSplit?.cgst ?? 0)} + SGST ${inr(o.taxSplit?.sgst ?? 0)}`} = {inr(o.taxTotal)}</dd>
                </div>
              )}
              {o.razorpayPaymentId && <div className="flex justify-between text-grey"><dt>Razorpay payment</dt><dd className="font-mono text-[12px]">{o.razorpayPaymentId}</dd></div>}
            </dl>
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Fulfilment"><OrderActions number={o.number} status={o.status} notes={o.notes ?? ""} defaultProvider={defaultProvider} tracking={{ carrier: o.carrier, trackingNumber: o.trackingNumber, trackingUrl: o.trackingUrl }} /></Card>
          <Card title="Customer">
            <div className="space-y-3 p-4 text-[13px]">
              <div><p className="font-medium">{a.name}</p><p className="text-grey">{prior} {prior === 1 ? "order" : "orders"}</p></div>
              <div><p className="text-[12px] font-medium text-grey">Contact</p><p>{o.email}</p><p>{o.phone}</p></div>
              <div><p className="text-[12px] font-medium text-grey">Shipping address</p><p>{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Page({ params }: PageProps<"/admin/orders/[number]">) {
  return <Suspense fallback={<div className="h-64" aria-busy />}><Detail params={params} /></Suspense>;
}
