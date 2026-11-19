// Time-bound % off a programme's fee. Admin-configured per programme (Admin → Programmes → Sale);
// no coupon code — if the sale window is active, the discounted price just applies on the site.
import type { Program } from "./programs";

export type Sale = NonNullable<Program["sale"]>;
export type EffectiveFee = { label: string; amount: number; note?: string; original?: number };

/** Is this programme's sale live right now? */
export function saleActive(p: Pick<Program, "sale">, now: Date = new Date()): boolean {
  const s = p.sale;
  if (!s || !s.percent || s.percent <= 0) return false;
  const start = s.startsAt ? new Date(s.startsAt) : null;
  const end = s.endsAt ? new Date(s.endsAt) : null;
  if (start && Number.isFinite(start.getTime()) && now < start) return false;
  if (end && Number.isFinite(end.getTime()) && now >= end) return false;
  return true;
}

/** Milliseconds left in the sale window (for a countdown), or null if there's no active, timed sale. */
export function saleEndsInMs(p: Pick<Program, "sale">, now: Date = new Date()): number | null {
  if (!saleActive(p, now)) return null;
  const end = p.sale?.endsAt ? new Date(p.sale.endsAt) : null;
  if (!end || !Number.isFinite(end.getTime())) return null;
  return Math.max(0, end.getTime() - now.getTime());
}

/** Fee rows with the sale discount applied (amount = discounted, original = pre-sale price when a sale is live). */
export function effectiveFees(p: Pick<Program, "fee" | "sale">, now: Date = new Date()): EffectiveFee[] {
  const fee = p.fee ?? [];
  if (!saleActive(p, now)) return fee.map((f) => ({ ...f }));
  const pct = Math.min(90, Math.max(1, Math.round(p.sale!.percent)));
  return fee.map((f) => ({ ...f, original: f.amount, amount: Math.round((f.amount * (100 - pct)) / 100) }));
}
