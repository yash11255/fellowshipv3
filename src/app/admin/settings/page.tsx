import { connection } from "next/server";
import { requireStaff } from "@/lib/admin";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Settings" };

export default async function General() {
  await connection();
  await requireStaff("owner");
  const s = await getSettings();
  return (
    <SettingsForm title="Checkout & shipping fees" description="Applied to every cart and checkout immediately after saving."
      target={{ kind: "store" }} initial={s}
      fields={[
        { name: "freeShippingAt", label: "Free shipping above (₹)", type: "number", help: "Orders at or above this subtotal (after discounts) ship free." },
        { name: "shippingFee", label: "Shipping fee below threshold (₹)", type: "number" },
        { name: "codFee", label: "Cash on Delivery fee (₹)", type: "number", help: "Set 0 for no COD fee." },
        { name: "announcement", label: "Announcement bar text", type: "text", max: 140, help: "Shown at the top of every page." },
        { name: "codEnabled", label: "Offer Cash on Delivery", type: "toggle", help: "Turn off to accept online payments only." },
      ]} />
  );
}
