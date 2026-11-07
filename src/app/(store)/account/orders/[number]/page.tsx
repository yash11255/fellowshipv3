import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { OrderView, STATUS } from "@/components/account/order-view";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

async function Detail({ params }: { params: PageProps<"/account/orders/[number]">["params"] }) {
  const { number } = await params;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/account/orders/${number}`);
  const d = await db();
  const [order] = await d.select().from(schema.orders).where(and(eq(schema.orders.number, number), eq(schema.orders.userId, user.id))).limit(1);
  if (!order) notFound();
  const items = await d.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return (
    <>
      <Link href="/account" className="small hover:underline">← All orders</Link>
      <div className="mt-4 border-b border-line pb-8">
        <h1 className="hd-1">{order.number}</h1>
        <p className="body mt-2">{STATUS[order.status]} · {order.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
      <div className="pt-10"><OrderView order={order} items={items} /></div>
    </>
  );
}

export default function Page({ params }: PageProps<"/account/orders/[number]">) {
  return <div className="page pt-10 md:pt-14"><Suspense fallback={<div className="min-h-[60vh]" aria-busy />}><Detail params={params} /></Suspense></div>;
}
