import type { MemoryType } from "@runelay/shared";

export interface PinnedMemoryRow {
  slug: string;
  name: string;
  description: string;
}

export interface MemoryIndexRow {
  slug: string;
  name: string;
  description: string;
  type: MemoryType;
}

export interface SkillIndexRow {
  slug: string;
  name: string;
  description: string;
}

export interface BriefSources {
  pinned: PinnedMemoryRow[];
  memories: MemoryIndexRow[];
  skills: SkillIndexRow[];
}
