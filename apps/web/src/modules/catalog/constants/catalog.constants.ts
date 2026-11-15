import type { MessageKey } from "@/lib/i18n";

export type ConnectorTab = "catalog" | "installed";

export const CONNECTOR_TITLE: Record<ConnectorTab, MessageKey> = {
  catalog: "catalog.title.catalog",
  installed: "catalog.title.installed",
};

export const SIMPLE_ICONS_URL = "https://cdn.simpleicons.org";

export const FULL_BLEED_ICONS = new Set(["/logos/conty.png"]);

export const FEATURED_PITCH: Partial<Record<string, MessageKey>> = {
  conty: "catalog.featured.conty",
};
