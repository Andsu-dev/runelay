import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { HideNamesToggle } from "@/components/ui/action/hide-names-toggle";
import { PageHeader } from "@/components/ui/display/page-header";
import { SearchField } from "@/components/ui/form/search-field";
import { useT } from "@/lib/i18n";
import { SkillList } from "@/modules/skills/components/skill-list";
import { SkillsTotal } from "@/modules/skills/components/skills-total";

export const Route = createFileRoute("/_app/skills/")({
  validateSearch: z.object({ query: z.string().optional() }),
  component: SkillsPage,
});

function SkillsPage() {
  const t = useT();
  const { query = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title={t("skills.page.title")}
        description={<SkillsTotal query={query} />}
        actions={<HideNamesToggle />}
      />
      <SearchField
        value={query}
        placeholder={t("skills.page.search")}
        onSearch={(value) => navigate({ search: { query: value || undefined }, replace: true })}
        className="sm:max-w-sm"
      />
      <SkillList query={query} />
    </section>
  );
}
