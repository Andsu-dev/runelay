import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { PreferencesSection } from "@/modules/settings/components/preferences-section";

export const Route = createFileRoute("/_app/settings/preferences")({
  component: PreferencesSettingsPage,
});

function PreferencesSettingsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title={t("settings.pages.preferences.title")}
        description={t("settings.pages.preferences.description")}
      />
      <PreferencesSection />
    </section>
  );
}
