import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./settings";
import type { StoreSettings } from "./pricing";
import { totalOf } from "./fee-math";

export type PaymentRow = typeof schema.applicationPayments.$inferSelect;
type AppRow = typeof schema.applications.$inferSelect;

/** Indian financial year label for a date, e.g. 2026-27 (FY starts 1 April, IST). */
function fy(d: Date) {
  const ist = new Date(d.getTime() + 5.5 * 3600_000);
  const y = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

/**
 * Records a captured payment as an invoice. Idempotent on paymentId (a replayed confirmation returns the
 * existing row). Never throws: invoicing must not block a payment that has already been taken.
 */
export async function recordPayment(a: AppRow, paymentId: string, amount: number, kind: "full" | "deposit" | "balance"): Promise<PaymentRow | null> {
  try {
    const d = await db();
    const [existing] = await d.select().from(schema.applicationPayments).where(eq(schema.applicationPayments.paymentId, paymentId)).limit(1);
    if (existing) return existing;
    const taxable = Math.round(amount / (1 + a.gstRate / 100));
    const tmp = `tmp-${paymentId}`;
    return await d.transaction(async (tx) => {
      const [row] = await tx.insert(schema.applicationPayments).values({ applicationId: a.id, invoiceNo: tmp, paymentId, kind, amount, taxable, gst: amount - taxable, gstRate: a.gstRate }).returning();
      // Sequential, gap-free per insert order: AC/2026-27/0007
      const [u] = await tx.update(schema.applicationPayments).set({ invoiceNo: `AC/${fy(row.createdAt)}/${String(row.id).padStart(4, "0")}` }).where(eq(schema.applicationPayments.id, row.id)).returning();
      return u;
    });
  } catch (e) {
    console.error("recordPayment failed", e);
    return null;
  }
}

export async function paymentsFor(applicationId: number): Promise<PaymentRow[]> {
  try {
    return await (await db()).select().from(schema.applicationPayments).where(eq(schema.applicationPayments.applicationId, applicationId)).orderBy(asc(schema.applicationPayments.id));
  } catch { return []; }
}

export function invoiceUrl(a: Pick<AppRow, "paymentToken">, p: Pick<PaymentRow, "id">) {
  return `${(process.env.SITE_URL ?? "http://localhost:3200").replace(/\/$/, "")}/pay/${a.paymentToken}/invoice/${p.id}`;
}

const KIND: Record<string, string> = { full: "Full payment", deposit: "Booking deposit", balance: "Balance payment" };

/** Everything an invoice shows, computed once (page + email use the same numbers). */
export function invoiceModel(a: AppRow, p: PaymentRow, programTitle: string, s: StoreSettings) {
  const total = totalOf(a);
  const intra = true; // in-person training: place of supply = where it's held (seller's state) → CGST + SGST
  const half = Math.floor(p.gst / 2);
  const tax = intra ? { cgst: half, sgst: p.gst - half, igst: 0 } : { cgst: 0, sgst: 0, igst: p.gst };
  return {
    title: s.invoiceGstin ? "Tax invoice" : "Payment receipt",
    seller: { name: String(s.invoiceLegalName ?? ""), gstin: String(s.invoiceGstin ?? ""), address: String(s.invoiceAddress ?? ""), state: String(s.invoiceState ?? "") },
    buyer: { name: a.name, email: a.email, phone: a.phone, country: a.country },
    no: p.invoiceNo, date: p.createdAt, paymentId: p.paymentId, application: a.number,
    item: `${programTitle}${a.cohort ? ` · ${a.cohort}` : ""} (${KIND[p.kind] ?? p.kind})`, sac: String(s.invoiceSac ?? ""),
    taxable: p.taxable, gstRate: p.gstRate, ...tax, amount: p.amount,
    programmeTotal: total, paidToDate: a.amountPaid, balance: Math.max(0, total - a.amountPaid),
  };
}
export type InvoiceModel = ReturnType<typeof invoiceModel>;

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Email-safe HTML invoice (tables + inline styles). */
export function invoiceEmailHtml(m: InvoiceModel, intro: string, link: string) {
  const r = (k: string, v: string, b = false) => `<tr><td style="padding:6px 0;color:${b ? "#0f1526" : "#555"};${b ? "font-weight:700" : ""}">${k}</td><td align="right" style="padding:6px 0;${b ? "font-weight:700" : ""}">${v}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#eef3f6;font-family:-apple-system,Segoe UI,Inter,Arial,sans-serif;color:#0f1526">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden">
<tr><td style="background:#192136;padding:20px 28px;color:#fff"><div style="font-weight:600;font-size:16px">Arthroscopy College</div><div style="font-size:12px;opacity:.7">${esc(m.title)} ${esc(m.no)}</div></td></tr>
<tr><td style="padding:24px 28px 8px;font-size:15px;line-height:1.6">${esc(intro).replace(/\n/g, "<br>")}</td></tr>
<tr><td style="padding:8px 28px"><table width="100%" style="font-size:13px;border-collapse:collapse">
<tr><td valign="top" style="padding-bottom:12px"><div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.08em">Billed by</div><b>${esc(m.seller.name)}</b><br>${esc(m.seller.address)}${m.seller.gstin ? `<br>GSTIN ${esc(m.seller.gstin)}` : ""}</td>
<td valign="top" align="right" style="padding-bottom:12px"><div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.08em">Billed to</div><b>${esc(m.buyer.name)}</b><br>${esc(m.buyer.email)}<br>${esc(m.buyer.phone)} · ${esc(m.buyer.country)}</td></tr>
<tr><td style="color:#555">Invoice no. <b style="color:#0f1526">${esc(m.no)}</b></td><td align="right" style="color:#555">Date <b style="color:#0f1526">${m.date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })}</b></td></tr>
</table></td></tr>
<tr><td style="padding:8px 28px"><table width="100%" style="font-size:13px;border-collapse:collapse;border-top:1px solid #e5e7eb">
<tr><td style="padding:10px 0"><b>${esc(m.item)}</b><br><span style="color:#888">SAC ${esc(m.sac)} · Application ${esc(m.application)}</span></td><td align="right" style="padding:10px 0">${inr(m.taxable)}</td></tr>
</table><table width="100%" style="font-size:13px;border-collapse:collapse;border-top:1px solid #e5e7eb">
${m.igst ? r(`IGST ${m.gstRate}%`, inr(m.igst)) : r(`CGST ${m.gstRate / 2}%`, inr(m.cgst)) + r(`SGST ${m.gstRate / 2}%`, inr(m.sgst))}
${r("Amount paid", inr(m.amount), true)}
</table></td></tr>
<tr><td style="padding:8px 28px 4px"><table width="100%" style="font-size:12px;background:#f6f8fa;border-radius:12px;padding:10px 14px">
${r("Programme total (incl. GST)", inr(m.programmeTotal))}${r("Paid to date", inr(m.paidToDate))}${r("Balance remaining", m.balance ? inr(m.balance) : "Nil, fully paid", true)}
</table></td></tr>
<tr><td style="padding:16px 28px 24px"><a href="${link}" style="display:inline-block;padding:12px 22px;background:#0f1526;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">View / download invoice</a>
<div style="margin-top:10px;font-size:12px;color:#888">Payment reference ${esc(m.paymentId)}. This is a computer-generated ${m.title.toLowerCase()} and needs no signature.</div></td></tr>
</table></td></tr></table></body></html>`;
}

export async function invoiceSettings() { return getSettings(); }
