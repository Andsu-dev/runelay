import type { CreateMemoryInput, MemoryListItemView, MemoryView } from "@runeley/shared";

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

export type MemoryWriteInput = Pick<CreateMemoryInput, "slug" | "body"> &
  Partial<Pick<CreateMemoryInput, "name" | "description" | "type">>;
