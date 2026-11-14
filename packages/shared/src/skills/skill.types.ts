import type { z } from "zod";
import type {
  createSkillSchema,
  importSkillsSchema,
  listSkillsSchema,
  skillFileSchema,
  updateSkillSchema,
} from "./skill.schema";

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
export type ListSkillsInput = z.infer<typeof listSkillsSchema>;
export type ImportSkillsInput = z.infer<typeof importSkillsSchema>;
export type SkillFileInput = z.infer<typeof skillFileSchema>;

export interface SkillListItemView {
  slug: string;
  name: string;
  description: string;
  enabled: boolean;
  fileCount: number;
  updatedAt: string;
}

export interface SkillFileRefView {
  path: string;
  size: number;
}

export interface SkillView extends SkillListItemView {
  body: string;
  files: SkillFileRefView[];
  createdAt: string;
}

export interface SkillFileView {
  path: string;
  content: string;
}
