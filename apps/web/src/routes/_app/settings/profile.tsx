import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { ProfileSection } from "@/modules/settings/components/profile-section";

export const Route = createFileRoute("/_app/settings/profile")({
  component: ProfileSettingsPage,
});

function ProfileSettingsPage() {
  const t = useT();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("settings.pages.profile.title")} description={t("settings.pages.profile.description")} />
      <ProfileSection />
    </section>
  );
}
