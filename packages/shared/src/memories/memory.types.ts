import type { z } from "zod";
import type {
  createMemorySchema,
  importMemoriesSchema,
  listMemoriesSchema,
  memoryTypeSchema,
  updateMemorySchema,
} from "./memory.schema";

export type MemoryType = z.infer<typeof memoryTypeSchema>;
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type ListMemoriesInput = z.infer<typeof listMemoriesSchema>;
export type ImportMemoriesInput = z.infer<typeof importMemoriesSchema>;

export interface MemoryListItemView {
  slug: string;
  name: string;
  description: string;
  type: MemoryType;
  pinned: boolean;
  linkCount: number;
  backlinkCount: number;
  updatedAt: string;
}

export interface MemoryView extends MemoryListItemView {
  body: string;
  links: string[];
  backlinks: string[];
  brokenLinks: string[];
  createdAt: string;
}

export interface MemoryVersionView {
  id: number;
  name: string;
  description: string;
  body: string;
  createdAt: string;
}

export interface MemoryRefView {
  slug: string;
  name: string;
  updatedAt: string;
}

export interface MemoryHealthView {
  staleDays: number;
  stale: MemoryRefView[];
  brokenLinks: { from: string; to: string }[];
  isolated: MemoryRefView[];
  total: number;
}
