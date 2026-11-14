import type { IconSvgElement } from "@hugeicons/react";
import type { LinkOptions } from "@tanstack/react-router";

export interface NavLinkItem {
  label: string;
  icon: IconSvgElement;
  link: LinkOptions;
}

export interface NavSoonItem {
  label: string;
  icon: IconSvgElement;
  soon: true;
}

export interface NavSection {
  label: string;
  items: (NavLinkItem | NavSoonItem)[];
}

export interface NavCategory {
  id: string;
  label: string;
  icon: IconSvgElement;
  link: LinkOptions;
  paths: string[];
  showInstalled?: boolean;
  sections: NavSection[];
}
