import { connection } from "next/server";
import { requireStaff } from "@/lib/admin";
import { readMasked, razorpayConfig } from "@/lib/integrations";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Payments" };

export default async function Payments() {
  await connection();
  await requireStaff("owner");
  const saved = await readMasked("razorpay");
  const live = await razorpayConfig();
  const s = await getSettings();
  const fromEnv = !saved.keyId && !!process.env.RAZORPAY_KEY_ID;
  return (
    <>
      <div className="rounded-xl border border-[#e3e3e3] bg-white p-4 text-[13px]">
        <p className="font-semibold">Status</p>
        <ul className="mt-2 space-y-1">
          <li>{live ? <span className="text-ok">● Razorpay is accepting payments ({live.mode === "live" ? "LIVE" : "test mode"})</span> : <span className="text-sale">○ Razorpay is off: checkout shows UPI/cards as “Coming soon”</span>}{fromEnv ? " · keys from .env" : ""}</li>
          <li>{s.codEnabled ? "● Cash on Delivery is on" : "○ Cash on Delivery is off"} (change in General)</li>
        </ul>
      </div>
      <SettingsForm title="Razorpay" description="UPI, cards, netbanking and wallets. Use test keys (rzp_test_…) to try checkout without real money."
        target={{ kind: "integration", name: "razorpay", testable: true }}
        initial={{ enabled: (saved.enabled as boolean) ?? true, keyId: (saved.keyId as string) ?? "", keySecret: (saved.keySecret as string) ?? "", webhookSecret: (saved.webhookSecret as string) ?? "" }}
        fields={[
          { name: "keyId", label: "Key ID", type: "text", placeholder: "rzp_test_…" },
          { name: "keySecret", label: "Key secret", type: "secret", help: "Stored encrypted. Never shown again after saving." },
          { name: "webhookSecret", label: "Webhook secret", type: "secret", help: "Confirms payments even if the customer closes the tab." },
          { name: "enabled", label: "Enable Razorpay at checkout", type: "toggle" },
        ]}>
        <ol className="list-decimal space-y-1 pl-5 text-[12px] text-grey">
          <li>Razorpay Dashboard → switch to <b>Test mode</b> → Account &amp; Settings → API Keys → Generate key. Paste Key ID and Secret above.</li>
          <li>Settings → Webhooks → Add: URL <code className="rounded bg-[#f4f4f4] px-1">{(process.env.SITE_URL ?? "https://your-domain")}/api/razorpay/webhook</code>, events <b>payment.captured</b>, set a secret and paste it above.</li>
          <li>Click <b>Test connection</b>, then make a test payment on an accepted application using Razorpay&apos;s test UPI <code className="rounded bg-[#f4f4f4] px-1">success@razorpay</code> or test card 4111 1111 1111 1111.</li>
          <li>Going live: complete KYC in Razorpay, generate Live keys (rzp_live_…) and replace these.</li>
        </ol>
      </SettingsForm>
    </>
  );
}
