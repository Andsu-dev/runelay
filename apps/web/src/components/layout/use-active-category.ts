import { useLocation } from "@tanstack/react-router";
import type { NavCategory } from "./nav.types";
import { HOME_CATEGORY, NAV_CATEGORIES, SETTINGS_CATEGORY } from "./nav-items";

export const useActiveCategory = (): NavCategory => {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    [...NAV_CATEGORIES, SETTINGS_CATEGORY].find((category) =>
      category.paths.some((path) => pathname.startsWith(path)),
    ) ?? HOME_CATEGORY
  );
};
