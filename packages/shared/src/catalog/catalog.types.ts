import type { SourceStatus } from "../sources/source.types";

export type CatalogSectionId = "popular" | "dev" | "work";

export type CatalogAuth = "oauth" | "api_key" | "none";

export interface CatalogConnectorView {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string | null;
  auth: CatalogAuth;
  tokenUrl: string | null;
  featured: boolean;
  installed: boolean;
  sourceName: string | null;
  status: SourceStatus | null;
}

export interface CatalogSectionView {
  id: CatalogSectionId;
  title: string;
  items: CatalogConnectorView[];
}

export interface CatalogView {
  sections: CatalogSectionView[];
}
