import clsx from "clsx";
import type { ReactNode } from "react";

export const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const shortDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const dateTime = (d: Date) => d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h1>{sub && <p className="mt-0.5 text-[13px] text-grey">{sub}</p>}</div>
      {actions}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={clsx("rounded-xl border border-[#e3e3e3] bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-[#ececec] px-4 py-3">
          <h2 className="text-[14px] font-semibold">{title}</h2>{action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: string }> = {
  pending_payment: { label: "Awaiting payment", cls: "bg-[#fff1d6] text-[#5e4200]", icon: "◔" },
  confirmed: { label: "Unfulfilled", cls: "bg-[#ffeb78] text-[#4f4700]", icon: "○" },
  paid: { label: "Paid · Unfulfilled", cls: "bg-[#ffeb78] text-[#4f4700]", icon: "○" },
  shipped: { label: "Shipped", cls: "bg-[#e0f0ff] text-[#00376b]", icon: "→" },
  delivered: { label: "Delivered", cls: "bg-[#cdfee1] text-[#0c5132]", icon: "✓" },
  cancelled: { label: "Cancelled", cls: "bg-[#ebebeb] text-[#4a4a4a]", icon: "×" },
  refunded: { label: "Refunded", cls: "bg-[#ebebeb] text-[#4a4a4a]", icon: "↺" },
};

/** Status badge: always icon + text label, never colour alone. */
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { label: status, cls: "bg-[#ebebeb]", icon: "•" };
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium", s.cls)}><span aria-hidden>{s.icon}</span>{s.label}</span>;
}

export const btn = "inline-flex h-8 items-center justify-center rounded-lg bg-[#303030] px-3 text-[13px] font-medium text-white hover:bg-black disabled:opacity-50";
export const btnGhost = "inline-flex h-8 items-center justify-center rounded-lg border border-[#d4d4d4] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]";
export const input = "h-9 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 text-[14px] outline-none focus:border-black focus:ring-1 focus:ring-black";

/** File download (route handler returning an attachment). A plain <a download> is correct here, not <Link>. */
export function ExportLink({ type }: { type: "orders" | "customers" | "products" }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href={`/admin/export/${type}`} download className="inline-flex h-8 items-center rounded-lg border border-[#d4d4d4] bg-white px-3 text-[13px] font-medium hover:bg-[#f7f7f7]">Export CSV</a>
  );
}
