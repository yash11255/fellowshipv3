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
    <SettingsForm title="General" description="Site-wide text. Changes apply immediately."
      target={{ kind: "store" }} initial={s}
      fields={[
        { name: "announcement", label: "Announcement bar text", type: "text", max: 140, help: "Shown at the top of every page, e.g. next cohort dates or an early-bird offer. Leave empty to hide." },
        { name: "leadEmails", label: "Leads team emails", type: "text", max: 500, placeholder: "leads@example.com, sales@example.com", help: "Every application and contact/consultation form is emailed here with the full details. Separate several addresses with commas. Leave empty to turn off." },
        { name: "invoiceLegalName", label: "Invoice: legal business name", type: "text", max: 120, help: "Printed as the seller on every programme fee invoice." },
        { name: "invoiceGstin", label: "Invoice: GSTIN", type: "text", max: 15, placeholder: "06ABCDE1234F1Z5", help: "Leave empty if not GST-registered. The invoice is then titled \"Receipt\" instead of \"Tax invoice\"." },
        { name: "invoiceAddress", label: "Invoice: registered address", type: "textarea", max: 300 },
        { name: "invoiceState", label: "Invoice: business state", type: "text", max: 40, help: "Place of supply for in-person training. Same state → CGST + SGST, otherwise IGST." },
        { name: "invoiceSac", label: "Invoice: SAC code", type: "text", max: 10, help: "999293 = commercial training & coaching. Confirm with your CA." },
      ]} />
  );
}
