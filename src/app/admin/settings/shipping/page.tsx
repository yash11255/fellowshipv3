import { connection } from "next/server";
import { requireStaff } from "@/lib/admin";
import { readMasked } from "@/lib/integrations";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Shipping & delivery" };
const OPTS: [string, string][] = [["delhivery", "Delhivery"], ["shiprocket", "Shiprocket"], ["manual", "Manual (any courier, enter tracking)"]];

export default async function Shipping() {
  await connection();
  await requireStaff("owner");
  const [def, sr, dl] = await Promise.all([readMasked("shipping"), readMasked("shiprocket"), readMasked("delhivery")]);
  const str = (o: Record<string, unknown>, k: string, d = "") => (o[k] as string) ?? d;
  return (
    <>
      <SettingsForm title="Delivery routing" description="Which partner is pre-selected when you ship an order. Staff can still pick another partner per order."
        target={{ kind: "integration", name: "shipping" }}
        initial={{ codProvider: str(def, "codProvider", str(def, "defaultProvider", "delhivery")), prepaidProvider: str(def, "prepaidProvider", str(def, "defaultProvider", "shiprocket")) }}
        fields={[
          { name: "codProvider", label: "Cash on Delivery orders", type: "select", options: OPTS, help: "COD needs a partner with good cash-remittance terms." },
          { name: "prepaidProvider", label: "Prepaid (Razorpay) orders", type: "select", options: OPTS },
        ]} />

      <SettingsForm title="Shiprocket" description="One integration for 25+ couriers (Delhivery, Blue Dart, Xpressbees, Ekart…). Creates the order, assigns the cheapest courier and returns an AWB."
        target={{ kind: "integration", name: "shiprocket", testable: true }}
        initial={{ enabled: (sr.enabled as boolean) ?? false, email: str(sr, "email"), password: str(sr, "password"), pickupLocation: str(sr, "pickupLocation", "Primary") }}
        fields={[
          { name: "email", label: "API user email", type: "text", help: "Shiprocket → Settings → API → Create an API User (not your login)." },
          { name: "password", label: "API user password", type: "secret" },
          { name: "pickupLocation", label: "Pickup location nickname", type: "text", help: "Exactly as named in Shiprocket → Settings → Pickup Addresses." },
          { name: "enabled", label: "Enable Shiprocket", type: "toggle" },
        ]} />

      <SettingsForm title="Delhivery (direct)" description="Use if you have a direct Delhivery B2C account."
        target={{ kind: "integration", name: "delhivery", testable: true }}
        initial={{ enabled: (dl.enabled as boolean) ?? false, token: str(dl, "token"), pickupName: str(dl, "pickupName"), mode: str(dl, "mode", "staging") }}
        fields={[
          { name: "token", label: "API token", type: "secret", help: "From your Delhivery One account manager / developer portal." },
          { name: "pickupName", label: "Registered pickup (warehouse) name", type: "text" },
          { name: "mode", label: "Environment", type: "select", options: [["staging", "Staging (test)"], ["live", "Live"]] },
          { name: "enabled", label: "Enable Delhivery", type: "toggle" },
        ]} />
      <p className="text-[12px] text-grey">Need another partner (Blue Dart, Shadowfax, Ecom Express)? Each is a small adapter in <code>src/lib/shipping</code>. Until then use Manual and paste their tracking number.</p>
    </>
  );
}
