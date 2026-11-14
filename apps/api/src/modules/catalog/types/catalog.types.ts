import type { CatalogConnectorView, CatalogSectionView } from "@runeley/shared";

export type CatalogEntry = Omit<CatalogConnectorView, "installed" | "sourceName" | "status">;

export interface CatalogSection extends Omit<CatalogSectionView, "items"> {
  items: CatalogEntry[];
}
