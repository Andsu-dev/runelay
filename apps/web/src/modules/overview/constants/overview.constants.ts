import type { MessageKey } from "@/lib/i18n";

export const USAGE_KINDS: Record<string, { label: MessageKey; color: string }> = {
  connectors: { label: "overview.kinds.connectors", color: "var(--chart-1)" },
  skills: { label: "overview.kinds.skills", color: "var(--chart-2)" },
  memories: { label: "overview.kinds.memories", color: "var(--chart-3)" },
  search: { label: "overview.kinds.search", color: "var(--chart-4)" },
};
