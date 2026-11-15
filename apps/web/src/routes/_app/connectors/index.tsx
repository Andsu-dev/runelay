import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { FadeIn } from "@/components/ui/display/fade-in";
import { PageHeader } from "@/components/ui/display/page-header";
import { SearchField } from "@/components/ui/form/search-field";
import { useT } from "@/lib/i18n";
import { AddConnectorMenu } from "@/modules/catalog/components/add-connector-menu";
import { CatalogView } from "@/modules/catalog/components/catalog-view";
import { InstalledView } from "@/modules/catalog/components/installed-view";
import { RefreshSourcesButton } from "@/modules/catalog/components/refresh-sources-button";
import { CONNECTOR_TITLE } from "@/modules/catalog/constants/catalog.constants";

export const Route = createFileRoute("/_app/connectors/")({
  validateSearch: z.object({
    tab: z.enum(["catalog", "installed"]).optional(),
    query: z.string().optional(),
  }),
  component: ConnectorsPage,
});

function ConnectorsPage() {
  const t = useT();
  const { tab = "catalog", query = "" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title={t(CONNECTOR_TITLE[tab])}
        description={t("catalog.description")}
        actions={
          <div className="flex items-center gap-2">
            <RefreshSourcesButton />
            <AddConnectorMenu />
          </div>
        }
      />
      {tab === "catalog" && (
        <SearchField
          value={query}
          placeholder={t("catalog.search")}
          onSearch={(value) => navigate({ search: (prev) => ({ ...prev, query: value || undefined }), replace: true })}
        />
      )}
      <FadeIn key={tab}>{tab === "catalog" ? <CatalogView query={query} /> : <InstalledView />}</FadeIn>
    </section>
  );
}
