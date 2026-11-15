import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { DesktopServersSection } from "@/modules/settings/components/desktop-servers-section";
import { McpEndpointSection } from "@/modules/settings/components/mcp-endpoint-section";
import { ServerOverviewSection } from "@/modules/settings/components/server-overview-section";
import { StartupSection } from "@/modules/settings/components/startup-section";

export const Route = createFileRoute("/_app/settings/server")({
  component: ServerSettingsPage,
});

function ServerSettingsPage() {
  const t = useT();
  const bridge = window.runelayDesktop;

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("settings.pages.server.title")} description={t("settings.pages.server.description")} />
      <ServerOverviewSection />
      {bridge && <DesktopServersSection bridge={bridge} />}
      {bridge?.getStartup && <StartupSection bridge={bridge} />}
      <McpEndpointSection />
    </section>
  );
}
