import { ServerStack01Icon } from "@hugeicons/core-free-icons";
import { CopyButton } from "@/components/ui/action/copy-button";
import { useT } from "@/lib/i18n";
import { ServerStatusRow } from "./server-status-row";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

export function ServerOverviewSection() {
  const origin = window.location.origin;
  const t = useT();

  return (
    <SettingsSection icon={ServerStack01Icon} title={t("settings.server.overviewTitle")}>
      <SettingsRow label={t("settings.server.address")} description={origin}>
        <CopyButton value={origin} label={t("settings.server.copyAddress")} />
      </SettingsRow>
      <ServerStatusRow />
    </SettingsSection>
  );
}
