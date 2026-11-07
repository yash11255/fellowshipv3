import { PageHeader } from "@/components/admin/ui";
import { SettingsTabs } from "@/components/admin/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsTabs />
      <div className="mt-4 max-w-4xl space-y-4">{children}</div>
    </>
  );
}
