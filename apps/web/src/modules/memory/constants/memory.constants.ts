import type { MemoryType } from "@runelay/shared";
import type { MessageKey } from "@/lib/i18n";

export const MEMORY_TYPE_LABEL: Record<MemoryType, MessageKey> = {
  user: "memory.types.user",
  feedback: "memory.types.feedback",
  project: "memory.types.project",
  reference: "memory.types.reference",
};

export const MEMORY_TYPE_OPTIONS = [
  { value: "user", label: "memory.types.user" },
  { value: "feedback", label: "memory.types.feedback" },
  { value: "project", label: "memory.types.project" },
  { value: "reference", label: "memory.types.reference" },
] as const satisfies readonly { value: MemoryType; label: MessageKey }[];

export const MEMORY_FILTERS = [
  { value: "all", label: "memory.filters.all" },
  ...MEMORY_TYPE_OPTIONS,
  { value: "pinned", label: "memory.filters.pinned" },
] as const;

export type MemoryFilter = (typeof MEMORY_FILTERS)[number]["value"];

export const MEMORY_FILTER_VALUES = MEMORY_FILTERS.map((filter) => filter.value) as [MemoryFilter, ...MemoryFilter[]];

export const MEMORY_FILTER_TITLE: Record<MemoryFilter, MessageKey> = {
  all: "memory.titles.all",
  user: "memory.titles.user",
  feedback: "memory.titles.feedback",
  project: "memory.titles.project",
  reference: "memory.titles.reference",
  pinned: "memory.titles.pinned",
};

export const HEALTH_DAYS = 30;

export const MEMORY_VIEWS = ["list", "graph"] as const;

export type MemoryPageView = (typeof MEMORY_VIEWS)[number];

export const MEMORY_GRAPH_GLASS =
  "rounded-xl bg-background/70 shadow-[inset_0_1px_0_var(--glass-highlight),inset_0_0_0_1px_var(--glass-edge)] backdrop-blur-md";

export const GRAPH = {
  nodeRadius: 2.5,
  nodeRadiusGrowth: 1,
  nodeRadiusMax: 9,
  nodeAlpha: 0.55,
  pinnedTint: 0.35,
  pinnedAlpha: 0.75,
  liftedAlpha: 0.8,
  hitPadding: 3,
  linkAlpha: 0.15,
  linkLitAlpha: 0.55,
  linkWidth: 0.5,
  linkLitWidth: 1,
  dim: 0.82,
  fadeStep: 0.22,
  labelSize: 11,
  labelZoomStart: 1.9,
  labelZoomRange: 0.8,
  labelAlpha: 0.78,
  labelGap: 2,
  labelHalo: 3,
  focusZoom: 2.6,
  focusMs: 600,
  fitMs: 500,
  fitInset: 0.1,
  zoomStep: 1.4,
  zoomMs: 250,
  cooldownMs: 6000,
  alphaDecay: 0.03,
  velocityDecay: 0.35,
  charge: -48,
  chargeRange: 280,
  linkDistance: 34,
  gravity: 0.06,
  minZoom: 0.1,
  maxZoom: 8,
} as const;
