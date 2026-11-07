import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { STATUS } from "@/components/account/order-view";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

async function Account() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");
  const d = await db();
  const orders = await d.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt));
  const saved = await d.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id));
  // fall back to the most recent order's address (e.g. orders placed as a guest before signing up)
  const addrs = saved.length ? saved : orders.slice(0, 1).map((o) => ({ id: o.id, data: o.shippingAddress }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div><h1 className="hd-1">Your account</h1><p className="body mt-2">{user.email}</p></div>
        <form action={logout}><button className="label underline-offset-4 hover:underline">Sign out</button></form>
      </div>

      <div className="grid gap-12 pt-10 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <h2 className="hd-3">Orders</h2>
          {orders.length === 0 ? (
            <div className="mt-6 bg-tile p-8">
              <p className="text-[15px]">No orders yet.</p>
              <Link href="/stack-builder" className="mt-3 inline-block text-[14px] underline">Find your stack →</Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.number}`} className="grid grid-cols-2 items-center gap-2 py-5 hover:bg-tile/50 md:grid-cols-4">
                    <span className="text-[15px] font-semibold">{o.number}</span>
                    <span className="text-[14px] text-grey md:order-none">{date(o.createdAt)}</span>
                    <span className="text-[14px]">{STATUS[o.status]}</span>
                    <span className="text-right text-[15px] font-semibold">{inr(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="lg:col-span-4">
          <h2 className="hd-3">Saved address</h2>
          {addrs.length === 0 ? <p className="small mt-4">Your address is saved when you place your first order.</p> : addrs.map((a) => (
            <p key={a.id} className="mt-4 text-[14px] leading-relaxed">{a.data.name}<br />{a.data.line1}<br />{a.data.city}, {a.data.state} {a.data.pincode}<br />{a.data.phone}</p>
          ))}
        </aside>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <div className="page pt-10 md:pt-14">
      <Suspense fallback={<div className="min-h-[60vh]" aria-busy />}><Account /></Suspense>
    </div>
  );
}
