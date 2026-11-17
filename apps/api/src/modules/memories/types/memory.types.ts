import type { MemoryImportItemInput, MemoryListItemView, MemoryView } from "@runelay/shared";

export interface MemoryListRow extends Omit<MemoryListItemView, "pinned"> {
  pinned: 0 | 1;
}

export interface MemoryDetailRow extends Omit<MemoryView, "pinned" | "links" | "backlinks" | "brokenLinks"> {
  pinned: 0 | 1;
  links: string;
  backlinks: string;
  brokenLinks: string;
}

export interface MemoryContent {
  slug: string;
  name: string;
  description: string;
  body: string;
}

export interface StoredMemoryRow extends Omit<MemoryContent, "slug"> {
  type: MemoryView["type"];
  pinned: 0 | 1;
  updatedAt: string;
}

export interface SimilarMemoryView {
  slug: string;
  name: string;
}

export interface MemoryWriteView extends MemoryView {
  similar?: SimilarMemoryView[];
  hint?: string;
}

export type RawMemoryImportItem = Omit<MemoryImportItemInput, "type"> & { type?: string };

export type MemoryImportStatus = "created" | "updated" | "skipped" | "failed";

export interface MemoryImportItemView {
  slug: string;
  status: MemoryImportStatus;
  similar?: SimilarMemoryView[];
  error?: string;
}

export interface MemoryImportView {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  items: MemoryImportItemView[];
  hint?: string;
}
