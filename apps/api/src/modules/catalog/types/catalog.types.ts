import type { CatalogConnectorView, CatalogSectionView } from "@runelay/shared";

export type CatalogEntry = Omit<CatalogConnectorView, "installed" | "sourceName" | "status">;

export interface CatalogSection extends Omit<CatalogSectionView, "items"> {
  items: CatalogEntry[];
}
