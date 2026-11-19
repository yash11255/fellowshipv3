// Single source of truth for programme fee maths (client-safe: used by the admin panel preview,
// the server when it creates payment links, and the pay page). All amounts are whole rupees.

/** Razorpay's standard domestic rate: 2% per payment, plus 18% GST on that fee. International cards cost more (~3%). */
export const GATEWAY_PERCENT = 2;
export const GATEWAY_GST_PERCENT = 18;

export type FeeBreakdown = {
  fee: number;          // programme fee, excl. GST (what you set)
  gstRate: number;      // %
  gst: number;          // GST added on top of the fee
  total: number;        // what the candidate pays in total = fee + gst
  payNowPercent: number;
  payNow: number;       // first payment link amount
  balance: number;      // paid later, via the same link
  gatewayFee: number;   // estimated Razorpay deduction across all payments (incl. GST on it)
  received: number;     // estimated money landing in your bank = total − gatewayFee
  netIncome: number;    // received − GST you must pass on to the government
};

/** Total the candidate pays for an application. When the fee was entered GST-inclusive, it *is* the total. */
export function totalOf(a: { feeAmount: number | null; gstRate: number; feeIncludesGst?: boolean | null }) {
  const fee = a.feeAmount ?? 0;
  return a.feeIncludesGst ? fee : Math.round(fee * (1 + a.gstRate / 100));
}

/** `amount` is the fee excl. GST, or (inclusive=true) the final price with GST already inside it. */
export function feeBreakdown(amount: number, gstRate: number, payNowPercent: number, inclusive = false): FeeBreakdown {
  const entered = Math.max(0, Math.round(amount || 0));
  const g = Math.max(0, gstRate || 0);
  const pct = Math.min(100, Math.max(1, Math.round(payNowPercent || 100)));
  const total = inclusive ? entered : Math.round(entered * (1 + g / 100));
  const f = inclusive ? Math.round(entered / (1 + g / 100)) : entered;
  const gst = total - f;
  const payNow = Math.round((total * pct) / 100);
  const balance = total - payNow;
  const gatewayFee = Math.round(total * (GATEWAY_PERCENT / 100) * (1 + GATEWAY_GST_PERCENT / 100));
  const received = total - gatewayFee;
  return { fee: f, gstRate: g, gst, total, payNowPercent: pct, payNow, balance, gatewayFee, received, netIncome: received - gst };
}

/** Plain-language status for staff and candidates. */
export const STATUS_LABEL: Record<string, string> = {
  new: "New", reviewing: "Reviewing", accepted: "Awaiting payment", paid: "Deposit paid · seat reserved",
  enrolled: "Paid in full · enrolled", rejected: "Rejected", withdrawn: "Withdrawn",
};
