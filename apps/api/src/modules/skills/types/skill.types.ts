import type { SkillListItemView, SkillView } from "@runeley/shared";

export interface SkillListRow extends Omit<SkillListItemView, "enabled"> {
  enabled: 0 | 1;
}

export interface SkillDetailRow extends Omit<SkillView, "enabled" | "files"> {
  enabled: 0 | 1;
  files: string;
}

export interface SkillContent {
  slug: string;
  name: string;
  description: string;
  body: string;
}
