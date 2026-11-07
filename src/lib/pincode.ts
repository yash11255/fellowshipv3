"use server";

import { delhiveryConfig, shiprocketConfig } from "./integrations";
import { getSettings } from "./settings";

type Result = { ok: true; serviceable: boolean; cod: boolean; eta: string; source: "delhivery" | "shiprocket" | "estimate"; city?: string } | { ok: false; error: string };

// Rough ETA by first digit of the pincode (postal zone) from a Delhi warehouse. Replaced by courier data when connected.
const ZONE_DAYS: Record<string, [number, number]> = { "1": [1, 3], "2": [2, 4], "3": [3, 5], "4": [3, 5], "5": [4, 6], "6": [4, 7], "7": [4, 7], "8": [4, 7], "9": [5, 8] };

function etaText(min: number, max: number) {
  const d = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${d(min)} – ${d(max)}`;
}

export async function checkPincode(pin: string): Promise<Result> {
  if (!/^[1-9]\d{5}$/.test(pin)) return { ok: false, error: "Enter a valid 6-digit pincode." };
  const settings = await getSettings();
  const [min, max] = ZONE_DAYS[pin[0]] ?? [4, 8];

  const dl = await delhiveryConfig();
  if (dl.enabled && dl.token) {
    try {
      const base = dl.mode === "live" ? "https://track.delhivery.com" : "https://staging-express.delhivery.com";
      const r = await fetch(`${base}/c/api/pin-codes/json/?filter_codes=${pin}`, { headers: { Authorization: `Token ${dl.token}` }, signal: AbortSignal.timeout(4000) });
      const j = (await r.json()) as { delivery_codes?: { postal_code: { cod: string; pre_paid: string; city?: string } }[] };
      const pc = j.delivery_codes?.[0]?.postal_code;
      if (r.ok) return { ok: true, serviceable: !!pc && (pc.pre_paid === "Y" || pc.cod === "Y"), cod: settings.codEnabled && pc?.cod === "Y", eta: etaText(min, max), source: "delhivery", city: pc?.city };
    } catch { /* fall through to estimate */ }
  }
  const sr = await shiprocketConfig();
  if (sr.enabled && sr.email && sr.password) {
    try {
      const login = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sr.email, password: sr.password }), signal: AbortSignal.timeout(4000) });
      const { token } = (await login.json()) as { token?: string };
      const pickup = process.env.PICKUP_PINCODE ?? "110001";
      const r = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickup}&delivery_postcode=${pin}&weight=0.5&cod=1`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(4000) });
      const j = (await r.json()) as { data?: { available_courier_companies?: { cod: number; etd?: string; estimated_delivery_days?: string }[] } };
      const cs = j.data?.available_courier_companies ?? [];
      const days = Math.min(...cs.map((c) => Number(c.estimated_delivery_days) || 99));
      if (r.ok) return { ok: true, serviceable: cs.length > 0, cod: settings.codEnabled && cs.some((c) => c.cod === 1), eta: Number.isFinite(days) && days < 99 ? etaText(days, days + 1) : etaText(min, max), source: "shiprocket" };
    } catch { /* fall through */ }
  }
  return { ok: true, serviceable: true, cod: settings.codEnabled, eta: etaText(min, max), source: "estimate" };
}
