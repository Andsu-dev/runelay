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

  const sections = catalog?.sections.filter((section) => section.items.length > 0) ?? [];

  if (sections.length === 0) {
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
      {sections.map((section) => (
        <StaggerItem key={section.id}>
          <CatalogSection section={section} />
        </StaggerItem>
      ))}
    </StaggerIn>
  );
}
