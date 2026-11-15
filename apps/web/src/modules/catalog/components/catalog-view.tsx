import { PlugSocketIcon } from "@hugeicons/core-free-icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { StaggerIn } from "@/components/layout/stagger-in";
import { StaggerItem } from "@/components/layout/stagger-item";
import { EmptyState } from "@/components/ui/display/empty-state";
import { ListSkeleton } from "@/components/ui/display/list-skeleton";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { catalogQuery } from "@/modules/catalog/api/catalog.api";
import { CatalogSection } from "./catalog-section";
import { FeaturedConnectorCard } from "./featured-connector-card";

interface CatalogViewProps {
  query: string;
}

export function CatalogView({ query }: CatalogViewProps) {
  const t = useT();
  const {
    data: catalog,
    isPending,
    isPlaceholderData,
  } = useQuery({
    ...catalogQuery(query),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <ListSkeleton columns={2} />;

  const featured = catalog?.sections.flatMap((section) => section.items.filter((item) => item.featured)) ?? [];
  const sections =
    catalog?.sections
      .map((section) => ({ ...section, items: section.items.filter((item) => !item.featured) }))
      .filter((section) => section.items.length > 0) ?? [];

  if (featured.length === 0 && sections.length === 0) {
    return (
      <EmptyState
        icon={PlugSocketIcon}
        title={query ? t("catalog.emptyQuery", { query }) : t("catalog.emptyCatalog")}
        description={t("catalog.emptyDescription")}
      />
    );
  }

  return (
    <StaggerIn
      key={query}
      gap={0.06}
      className={cn("-mx-3 flex flex-col gap-5 transition-opacity duration-200", isPlaceholderData && "opacity-60")}
    >
      {featured.map((connector) => (
        <StaggerItem key={connector.id} className="px-3">
          <FeaturedConnectorCard connector={connector} />
        </StaggerItem>
      ))}
      {sections.map((section) => (
        <StaggerItem key={section.id}>
          <CatalogSection section={section} />
        </StaggerItem>
      ))}
    </StaggerIn>
  );
}
