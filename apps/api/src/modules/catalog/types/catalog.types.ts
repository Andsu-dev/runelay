import type { CatalogConnectorView, CatalogSectionView, GoogleService } from "@runelay/shared";
import type { OAuthBroker } from "@/modules/oauth/types/oauth.types";

export type CatalogEntry = Omit<CatalogConnectorView, "installed" | "sourceName" | "status" | "tokenUrl"> & {
  tokenUrl?: string;
  broker?: OAuthBroker;
  googleService?: GoogleService;
};

export interface CatalogSection extends Omit<CatalogSectionView, "items"> {
  items: CatalogEntry[];
}

export interface CatalogInstallOptions {
  token?: string;
  services?: GoogleService[];
}
