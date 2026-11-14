import type { CatalogConnectorView, CatalogSectionView } from "@runelay/shared";

export type CatalogEntry = Omit<CatalogConnectorView, "installed" | "sourceName" | "status" | "tokenUrl"> & {
  tokenUrl?: string;
};

export interface CatalogSection extends Omit<CatalogSectionView, "items"> {
  items: CatalogEntry[];
}
