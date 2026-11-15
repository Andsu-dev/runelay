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
