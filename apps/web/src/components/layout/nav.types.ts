import type { IconSvgElement } from "@hugeicons/react";
import type { LinkOptions } from "@tanstack/react-router";
import type { MessageKey } from "@/lib/i18n";

export interface NavLinkItem {
  label: MessageKey;
  icon: IconSvgElement;
  link: LinkOptions;
}

export interface NavSoonItem {
  label: MessageKey;
  icon: IconSvgElement;
  soon: true;
}

export interface NavSection {
  label: MessageKey;
  items: (NavLinkItem | NavSoonItem)[];
}

export interface NavCategory {
  id: string;
  label: MessageKey;
  icon: IconSvgElement;
  link: LinkOptions;
  paths: string[];
  showInstalled?: boolean;
  sections: NavSection[];
}
