import Image from "next/image";
import type { InferSelectModel } from "drizzle-orm";
import type { schema } from "@/db";

type Order = InferSelectModel<typeof schema.orders>;
type Item = InferSelectModel<typeof schema.orderItems>;

const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const STATUS: Record<Order["status"], string> = {
  pending_payment: "Awaiting payment", confirmed: "Confirmed", paid: "Paid", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};
const STEPS = ["Confirmed", "Shipped", "Delivered"];

export function OrderView({ order, items }: { order: Order; items: Item[] }) {
  const a = order.shippingAddress;
  const stage = order.status === "delivered" ? 2 : order.status === "shipped" ? 1 : ["confirmed", "paid"].includes(order.status) ? 0 : -1;
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        {stage >= 0 && (
          <ol className="mb-10 grid grid-cols-3 gap-2">
            {STEPS.map((s, i) => (
              <li key={s}>
                <div className={`h-[3px] ${i <= stage ? "bg-black" : "bg-line"}`} />
                <p className={`mt-2 text-[13px] ${i <= stage ? "font-semibold" : "text-grey"}`}>{s}</p>
              </li>
            ))}
          </ol>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((it) => (
            <li key={`${it.productHandle}-${it.months}`} className="flex gap-4 py-4">
              <div className="relative size-20 shrink-0 bg-tile">{it.image && <Image src={it.image} alt="" fill sizes="80px" className="object-contain mix-blend-multiply" />}</div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold">{it.title}</p>
                <p className="small">{it.months ? `${it.months}-month supply · ` : ""}Qty {it.qty}</p>
              </div>
              <p className="text-[15px] font-semibold">{inr(it.price * it.qty)}</p>
            </li>
          ))}
        </ul>
      </div>
      <aside className="space-y-6 lg:col-span-5">
        <div className="bg-tile p-6">
          <dl className="space-y-2 text-[14px]">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between text-ok"><dt>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd>−{inr(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shipping ? inr(order.shipping) : "Free"}</dd></div>
            {order.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(order.codFee)}</dd></div>}
            <div className="flex justify-between border-t border-line pt-3 text-[17px] font-semibold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
          </dl>
          {order.taxTotal > 0 && <p className="small mt-1">Includes {inr(order.taxTotal)} GST{order.taxSplit?.igst ? " (IGST)" : " (CGST + SGST)"}</p>}
          <p className="small mt-3">{order.paymentMethod === "cod" ? "Cash on Delivery: pay when your order arrives." : order.status === "pending_payment" ? "Payment not completed." : "Paid online via Razorpay."}</p>
        </div>
        {order.trackingNumber && (
          <div className="border border-black p-4">
            <p className="label">Shipped with {order.carrier}</p>
            <p className="mt-2 text-[14px]">Tracking number <span className="font-semibold">{order.trackingNumber}</span></p>
            {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center bg-black px-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Track package</a>}
          </div>
        )}
        <div>
          <p className="label">Delivering to</p>
          <p className="mt-2 text-[14px] leading-relaxed">{a.name}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
        </div>
      </aside>
    </div>
  );
}
