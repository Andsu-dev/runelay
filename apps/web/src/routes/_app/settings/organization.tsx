import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { OrganizationSettingsSection } from "@/modules/organizations/components/organization-settings-section";

export const Route = createFileRoute("/_app/settings/organization")({
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title={t("settings.pages.organization.title")}
        description={t("settings.pages.organization.description")}
      />
      <OrganizationSettingsSection />
    </section>
  );
}
