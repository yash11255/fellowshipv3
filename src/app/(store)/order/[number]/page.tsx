import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { checkOrderToken, currentUser } from "@/lib/auth";
import { OrderView, STATUS } from "@/components/account/order-view";
import { ReturnRequest } from "@/components/account/return-request";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

async function Order({ params, searchParams }: { params: PageProps<"/order/[number]">["params"]; searchParams: PageProps<"/order/[number]">["searchParams"] }) {
  await connection();
  const { number } = await params;
  const sp = await searchParams;
  const d = await db();
  const [order] = await d.select().from(schema.orders).where(eq(schema.orders.number, number)).limit(1);
  if (!order) notFound();
  // Access: signed link (guest) or the signed-in owner.
  const user = await currentUser();
  const allowed = checkOrderToken(number, typeof sp.t === "string" ? sp.t : undefined) || (user && order.userId === user.id);
  if (!allowed) notFound();
  const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  const first = order.shippingAddress.name.split(" ")[0];
  const [ret] = await d.select().from(schema.returns).where(eq(schema.returns.orderId, order.id)).orderBy(desc(schema.returns.createdAt)).limit(1);

  return (
    <>
      <div className="border-b border-line pb-8">
        <p className="label text-grey">Order {order.number} · {STATUS[order.status]}</p>
        <h1 className="hd-1 mt-3">{order.status === "pending_payment" ? "Payment pending" : `Thank you, ${first}`}</h1>
        <p className="body mt-3 max-w-[60ch]">
          {order.status === "pending_payment"
            ? "We've saved your order but haven't received payment yet. If money was deducted, it will be confirmed automatically within a few minutes."
            : `We've emailed a confirmation to ${order.email}. We'll send tracking details by SMS and email when it ships.`}
        </p>
      </div>
      <div className="pt-10"><OrderView order={order} items={items} /></div>
      {["shipped", "delivered", "refunded"].includes(order.status) && (
        <div className="mt-8 max-w-xl"><ReturnRequest number={order.number} token={typeof sp.t === "string" ? sp.t : undefined} existing={ret ? { status: ret.status, reason: ret.reason, staffNote: ret.staffNote } : null} /></div>
      )}
      <div className="mt-12 flex flex-wrap gap-3">
        {order.status !== "pending_payment" && <Link href={`/invoice/${order.number}?t=${typeof sp.t === "string" ? sp.t : ""}`} target="_blank" className="inline-flex h-12 items-center border border-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em]">Download invoice</Link>}
        <Link href="/shop" className="inline-flex h-12 items-center bg-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em] text-white">Continue shopping</Link>
        {!user && <Link href={`/login?next=/account`} className="inline-flex h-12 items-center border border-black px-8 text-[12px] font-semibold uppercase tracking-[0.06em]">Create account to track orders</Link>}
      </div>
    </>
  );
}

export default function Page(props: PageProps<"/order/[number]">) {
  return (
    <div className="page pt-10 md:pt-14">
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy />}>
        <Order params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
