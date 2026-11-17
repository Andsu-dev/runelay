import { ComputerTerminal01Icon } from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { McpEndpoint } from "./mcp-endpoint";
import { SettingsSection } from "./settings-section";

export function McpEndpointSection() {
  const t = useT();

  return (
    <SettingsSection icon={ComputerTerminal01Icon} title={t("settings.agents.title")}>
      <McpEndpoint />
      <p className="text-[13px] text-muted-foreground">
        {t("settings.agents.hint")}{" "}
        <Link to="/setup" className="font-medium text-foreground underline-offset-4 hover:underline">
          {t("settings.agents.setup")}
        </Link>
      </p>
    </SettingsSection>
  );
}
