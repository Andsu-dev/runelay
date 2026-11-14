import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/display/page-header";
import { SetupGuide } from "@/modules/setup/components/setup-guide";

export const Route = createFileRoute("/_app/setup")({
  component: SetupPage,
});

function SetupPage() {
  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Configurar agentes"
        description="Cinco passos para o Claude, o Codex, o Cursor e o Grok usarem as mesmas contas e o mesmo contexto."
      />
      <SetupGuide />
    </section>
  );
}
