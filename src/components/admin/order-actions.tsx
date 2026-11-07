"use client";

import { useState, useTransition } from "react";
import { setOrderStatus, shipOrder } from "@/lib/admin-actions";
import { btn, btnGhost, input } from "./ui";

const NEXT: Record<string, { to: string; label: string }[]> = {
  pending_payment: [{ to: "cancelled", label: "Cancel order" }],
  confirmed: [{ to: "cancelled", label: "Cancel order" }],
  paid: [{ to: "refunded", label: "Mark refunded" }],
  shipped: [{ to: "delivered", label: "Mark as delivered" }],
  delivered: [{ to: "refunded", label: "Mark refunded" }],
  cancelled: [], refunded: [],
};

type Provider = "manual" | "shiprocket" | "delhivery";
type Tracking = { carrier: string | null; trackingNumber: string | null; trackingUrl: string | null };

export function OrderActions({ number, status, notes, defaultProvider, tracking }: { number: string; status: string; notes: string; defaultProvider: Provider; tracking: Tracking }) {
  const [pending, start] = useTransition();
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  const [man, setMan] = useState({ carrier: "", trackingNumber: "", trackingUrl: "" });
  const [shipErr, setShipErr] = useState("");
  const canShip = status === "confirmed" || status === "paid";
  const ship = () => start(async () => {
    setShipErr("");
    const r = await shipOrder(number, provider, provider === "manual" ? man : undefined);
    if (!r.ok) setShipErr(r.error);
  });
  const [note, setNote] = useState(notes);
  const [saved, setSaved] = useState(false);
  const run = (to: string) => {
    if ((to === "cancelled" || to === "refunded") && !confirm(`Change ${number} to ${to}?`)) return;
    start(async () => { await setOrderStatus(number, to); });
  };
  return (
    <div className="space-y-4 p-4">
      {canShip && (
        <div className="space-y-3 rounded-lg border border-[#e3e3e3] p-3">
          <p className="text-[13px] font-semibold">Ship this order</p>
          <select aria-label="Delivery partner" className={input} value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
            <option value="manual">Manual: any courier, enter tracking</option>
            <option value="shiprocket">Shiprocket (auto-assign courier)</option>
            <option value="delhivery">Delhivery</option>
          </select>
          {provider === "manual" && (
            <div className="grid gap-2">
              <input aria-label="Courier" placeholder="Courier (e.g. Blue Dart)" className={input} value={man.carrier} onChange={(e) => setMan({ ...man, carrier: e.target.value })} />
              <input aria-label="Tracking number" placeholder="Tracking / AWB number" className={input} value={man.trackingNumber} onChange={(e) => setMan({ ...man, trackingNumber: e.target.value })} />
              <input aria-label="Tracking URL" placeholder="Tracking URL (optional)" className={input} value={man.trackingUrl} onChange={(e) => setMan({ ...man, trackingUrl: e.target.value })} />
            </div>
          )}
          {shipErr && <p role="alert" className="text-[12px] text-sale">{shipErr}</p>}
          <button onClick={ship} disabled={pending} className={`${btn} w-full`}>{pending ? "Creating shipment…" : provider === "manual" ? "Mark as shipped" : `Create ${provider === "shiprocket" ? "Shiprocket" : "Delhivery"} shipment`}</button>
          <p className="text-[12px] text-grey">The customer gets an email with tracking.</p>
        </div>
      )}
      {tracking.trackingNumber && (
        <div className="rounded-lg bg-[#f6f6f7] p-3 text-[13px]">
          <p className="font-semibold">{tracking.carrier}</p>
          <p>AWB {tracking.trackingNumber}</p>
          {tracking.trackingUrl && <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="text-[#005bd3] hover:underline">Track shipment ↗</a>}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {NEXT[status]?.map((a, i) => (
          <button key={a.to} onClick={() => run(a.to)} disabled={pending} className={i === 0 ? btn : btnGhost}>{a.label}</button>
        ))}
        {!NEXT[status]?.length && !canShip && <p className="text-[13px] text-grey">No further actions.</p>}
      </div>
      <div>
        <label htmlFor="note" className="text-[13px] font-medium">Internal note</label>
        <textarea id="note" value={note} onChange={(e) => { setNote(e.target.value); setSaved(false); }} rows={3}
          className="mt-1 w-full rounded-lg border border-[#d4d4d4] p-2 text-[13px] outline-none focus:border-black" placeholder="Visible to staff only" />
        <button disabled={pending} onClick={() => start(async () => { await setOrderStatus(number, status, note); setSaved(true); })} className={`${btnGhost} mt-2`}>
          {saved ? "Saved" : "Save note"}
        </button>
      </div>
    </div>
  );
}
