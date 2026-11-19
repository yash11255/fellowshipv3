// Shared, client-safe pricing rules. The server recomputes everything; clients only mirror for display.

export type StoreSettings = {
  freeShippingAt: number;
  shippingFee: number;
  codFee: number;
  codEnabled: boolean;
  announcement: string;
  /** Comma-separated inboxes that get a copy of every lead (applications, contact & consultation forms). */
  leadEmails: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  freeShippingAt: 999,
  shippingFee: 79,
  codFee: 49,
  codEnabled: true,
  announcement: "Enrol in the Fellowship and get the Advance ACL course free",
  leadEmails: "",
};

export type AppliedDiscount = { code: string; amount: number; freeShipping: boolean; label: string };

export function totals(subtotal: number, method: "cod" | "razorpay", s: StoreSettings = DEFAULT_SETTINGS, discount?: AppliedDiscount | null) {
  const disc = Math.min(discount?.amount ?? 0, subtotal);
  const after = subtotal - disc;
  const shipping = subtotal === 0 || discount?.freeShipping || after >= s.freeShippingAt ? 0 : s.shippingFee;
  const codFee = method === "cod" ? s.codFee : 0;
  return { subtotal, discount: disc, shipping, codFee, total: after + shipping + codFee };
}
