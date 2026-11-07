import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { currentUser } from "@/lib/auth";
import { razorpayEnabled } from "@/lib/razorpay";
import { db, schema } from "@/db";
import { loadCheckoutDraft } from "@/lib/enquiry-actions";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function Checkout({ searchParams }: { searchParams: PageProps<"/checkout">["searchParams"] }) {
  const sp = await searchParams;
  const recover = typeof sp.recover === "string" ? await loadCheckoutDraft(sp.recover) : null;
  const user = await currentUser();
  let prefill;
  if (user) {
    const [addr] = await (await db()).select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)).orderBy(desc(schema.addresses.isDefault)).limit(1);
    const [last] = addr ? [] : await (await db()).select({ a: schema.orders.shippingAddress }).from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)).limit(1);
    const address = addr?.data ?? last?.a;
    prefill = { phone: address?.phone ?? user.phone ?? "", address };
  }
  return <CheckoutForm signedInEmail={user?.email} prefill={recover && !prefill ? { email: recover.email } : prefill} razorpay={await razorpayEnabled()} recoverLines={recover?.lines} recoverToken={typeof sp.recover === "string" && recover ? sp.recover : undefined} />;
}

export default function Page({ searchParams }: PageProps<"/checkout">) {
  return (
    <Suspense fallback={<div className="page min-h-[70vh] pt-12" aria-busy />}>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}
