import "server-only";
import type { InferSelectModel } from "drizzle-orm";
import type { schema } from "@/db";
import { delhiveryConfig, shiprocketConfig } from "../integrations";

type Order = InferSelectModel<typeof schema.orders>;
type Item = InferSelectModel<typeof schema.orderItems>;

export type Shipment = { carrier: string; trackingNumber: string; trackingUrl: string; shipmentRef?: string };
export type ProviderId = "manual" | "shiprocket" | "delhivery";
export class ShippingError extends Error {}

// Package defaults until per-product weights exist. TODO: move to admin settings.
const PKG = { weightKg: 0.5, lengthCm: 15, breadthCm: 10, heightCm: 10 };

// ── Shiprocket ── https://apidocs.shiprocket.in
const SR = "https://apiv2.shiprocket.in/v1/external";
async function srToken() {
  const c = await shiprocketConfig();
  if (!c.enabled || !c.email || !c.password) throw new ShippingError("Shiprocket isn't connected. Add your API user in Settings → Shipping.");
  const r = await fetch(`${SR}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: c.email, password: c.password }) });
  if (!r.ok) throw new ShippingError(`Shiprocket login failed (${r.status}). Check the API user email/password.`);
  return { token: ((await r.json()) as { token: string }).token, pickup: c.pickupLocation || "Primary" };
}

async function shiprocketCreate(o: Order, items: Item[]): Promise<Shipment> {
  const { token, pickup } = await srToken();
  const a = o.shippingAddress;
  const h = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const body = {
    order_id: o.number, order_date: o.createdAt.toISOString().slice(0, 16).replace("T", " "), pickup_location: pickup,
    billing_customer_name: a.name, billing_last_name: "", billing_address: a.line1, billing_address_2: a.line2 ?? "",
    billing_city: a.city, billing_pincode: a.pincode, billing_state: a.state, billing_country: "India",
    billing_email: o.email, billing_phone: o.phone, shipping_is_billing: true,
    order_items: items.map((i) => ({ name: `${i.title}${i.months ? ` (${i.months}m)` : ""}`, sku: `${i.productHandle}-${i.months}`.slice(0, 50), units: i.qty, selling_price: i.price })),
    payment_method: o.paymentMethod === "cod" ? "COD" : "Prepaid",
    sub_total: o.subtotal - o.discount, total_discount: 0, shipping_charges: o.shipping,
    length: PKG.lengthCm, breadth: PKG.breadthCm, height: PKG.heightCm, weight: PKG.weightKg,
  };
  const r = await fetch(`${SR}/orders/create/adhoc`, { method: "POST", headers: h, body: JSON.stringify(body) });
  const j = (await r.json().catch(() => ({}))) as { shipment_id?: number; message?: string };
  if (!r.ok || !j.shipment_id) throw new ShippingError(`Shiprocket: ${j.message ?? r.status}`);
  const awbRes = await fetch(`${SR}/courier/assign/awb`, { method: "POST", headers: h, body: JSON.stringify({ shipment_id: j.shipment_id }) });
  const awb = (await awbRes.json().catch(() => ({}))) as { response?: { data?: { awb_code?: string; courier_name?: string } }; message?: string };
  const code = awb.response?.data?.awb_code;
  if (!code) throw new ShippingError(`Shiprocket order created (shipment ${j.shipment_id}) but AWB assignment failed: ${awb.message ?? awbRes.status}. Assign a courier in the Shiprocket panel.`);
  return { carrier: `Shiprocket · ${awb.response?.data?.courier_name ?? "courier"}`, trackingNumber: code, trackingUrl: `https://shiprocket.co/tracking/${code}`, shipmentRef: String(j.shipment_id) };
}

// ── Delhivery ── https://one.delhivery.com/developer-portal
async function delhiveryCreate(o: Order, items: Item[]): Promise<Shipment> {
  const c = await delhiveryConfig();
  if (!c.enabled || !c.token) throw new ShippingError("Delhivery isn't connected. Add your API token in Settings → Shipping.");
  const base = c.mode === "live" ? "https://track.delhivery.com" : "https://staging-express.delhivery.com";
  const a = o.shippingAddress;
  const data = {
    shipments: [{
      name: a.name, add: [a.line1, a.line2].filter(Boolean).join(", "), pin: a.pincode, city: a.city, state: a.state, country: "India", phone: o.phone,
      order: o.number, payment_mode: o.paymentMethod === "cod" ? "COD" : "Prepaid", cod_amount: o.paymentMethod === "cod" ? o.total : 0, total_amount: o.total,
      products_desc: items.map((i) => i.title).join(", ").slice(0, 200), quantity: String(items.reduce((s, i) => s + i.qty, 0)),
      weight: PKG.weightKg * 1000, shipment_length: PKG.lengthCm, shipment_width: PKG.breadthCm, shipment_height: PKG.heightCm,
    }],
    pickup_location: { name: c.pickupName || "Reverse Clinics" },
  };
  const r = await fetch(`${base}/api/cmu/create.json`, {
    method: "POST", headers: { Authorization: `Token ${c.token}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: `format=json&data=${encodeURIComponent(JSON.stringify(data))}`,
  });
  const j = (await r.json().catch(() => ({}))) as { packages?: { waybill?: string; status?: string; remarks?: string[] }[]; rmk?: string };
  const p = j.packages?.[0];
  if (!r.ok || !p?.waybill) throw new ShippingError(`Delhivery: ${p?.remarks?.join("; ") || j.rmk || r.status}`);
  return { carrier: "Delhivery", trackingNumber: p.waybill, trackingUrl: `https://www.delhivery.com/track/package/${p.waybill}` };
}

export async function createShipment(provider: ProviderId, o: Order, items: Item[], manual?: { carrier: string; trackingNumber: string; trackingUrl?: string }): Promise<Shipment> {
  if (provider === "shiprocket") return shiprocketCreate(o, items);
  if (provider === "delhivery") return delhiveryCreate(o, items);
  if (!manual?.carrier || !manual.trackingNumber) throw new ShippingError("Enter the courier name and tracking number.");
  return { carrier: manual.carrier.slice(0, 60), trackingNumber: manual.trackingNumber.slice(0, 60), trackingUrl: (manual.trackingUrl ?? "").slice(0, 300) };
}

/** Connection test used by the admin settings page. */
export async function testProvider(provider: "shiprocket" | "delhivery") {
  try {
    if (provider === "shiprocket") { await srToken(); return { ok: true as const }; }
    const c = await delhiveryConfig();
    if (!c.token) return { ok: false as const, error: "Add a token first." };
    const base = c.mode === "live" ? "https://track.delhivery.com" : "https://staging-express.delhivery.com";
    const r = await fetch(`${base}/c/api/pin-codes/json/?filter_codes=110001`, { headers: { Authorization: `Token ${c.token}` } });
    return r.ok ? { ok: true as const } : { ok: false as const, error: `Delhivery rejected the token (${r.status}).` };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Connection failed" };
  }
}
