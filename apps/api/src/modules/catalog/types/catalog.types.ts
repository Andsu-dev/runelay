import type { CatalogConnectorView, CatalogSectionView } from "@runelay/shared";
import type { OAuthBroker } from "@/modules/oauth/types/oauth.types";

export type CatalogEntry = Omit<CatalogConnectorView, "installed" | "sourceName" | "status" | "tokenUrl"> & {
  tokenUrl?: string;
  broker?: OAuthBroker;
};

export interface CatalogSection extends Omit<CatalogSectionView, "items"> {
  items: CatalogEntry[];
}
