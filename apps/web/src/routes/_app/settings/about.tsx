import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { AboutSection } from "@/modules/settings/components/about-section";

export const Route = createFileRoute("/_app/settings/about")({
  component: AboutSettingsPage,
});

function AboutSettingsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("settings.pages.about.title")} description={t("settings.pages.about.description")} />
      <AboutSection />
    </section>
  );
}
