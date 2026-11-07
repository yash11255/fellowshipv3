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
      ]} />
  );
}
