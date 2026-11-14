import type { LinkOptions } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { NAV_SEARCH_DEFAULTS } from "./nav-items";

export const useLinkActive = (link: LinkOptions) => {
  const location = useLocation();
  const target = String(link.to);
  const expected = typeof link.search === "object" && link.search ? (link.search as Record<string, unknown>) : null;
  if (!expected) return location.pathname.startsWith(target);
  if (location.pathname !== target) return false;
  const current = location.search as Record<string, unknown>;
  return Object.entries(expected).every(([key, value]) => (current[key] ?? NAV_SEARCH_DEFAULTS[key]) === value);
};
