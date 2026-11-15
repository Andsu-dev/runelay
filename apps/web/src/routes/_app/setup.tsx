import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { useT } from "@/lib/i18n";
import { SetupGuide } from "@/modules/setup/components/setup-guide";

export const Route = createFileRoute("/_app/setup")({
  component: SetupPage,
});

function SetupPage() {
  const t = useT();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title={t("setup.page.title")} description={t("setup.page.description")} />
      <SetupGuide />
    </section>
  );
}
