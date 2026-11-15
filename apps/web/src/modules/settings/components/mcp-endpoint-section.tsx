import { ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { CopyButton } from "@/components/ui/action/copy-button";
import { useT } from "@/lib/i18n";
import { MCP_PATH } from "@/modules/settings/constants/settings.constants";
import { SettingsRow } from "./settings-row";
import { SettingsSection } from "./settings-section";

export function McpEndpointSection() {
  const endpoint = `${window.location.origin}${MCP_PATH}`;
  const t = useT();

  return (
    <SettingsSection icon={ComputerTerminal01Icon} title={t("settings.agents.title")}>
      <SettingsRow label={t("settings.agents.endpoint")} description={endpoint}>
        <CopyButton value={endpoint} label={t("settings.agents.copyEndpoint")} />
      </SettingsRow>
      <p className="text-[13px] text-muted-foreground">
        {t("settings.agents.hint")}{" "}
        <Link to="/setup" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("settings.agents.setup")}
        </Link>
      </p>
    </SettingsSection>
  );
}
