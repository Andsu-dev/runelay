import {
  type CreateSkillInput,
  type ImportSkillsInput,
  ok,
  type Result,
  type SkillView,
  type UpdateSkillInput,
} from "@runelay/shared";
import { findSkill, insertSkill, updateSkillRow, upsertSkills } from "@/modules/skills/repositories/skill.repository";

export {
  deleteSkillRow as deleteSkill,
  exportSkills,
  findSkill,
  findSkillFile,
  listSkills,
} from "@/modules/skills/repositories/skill.repository";

export const createSkill = (organizationId: string, input: CreateSkillInput): Result<SkillView> => {
  const created = insertSkill(organizationId, input);
  return created.error ? created : findSkill(organizationId, input.slug);
};

export const updateSkill = (organizationId: string, slug: string, input: UpdateSkillInput): Result<SkillView> => {
  const updated = updateSkillRow(organizationId, slug, input);
  return updated.error ? updated : findSkill(organizationId, slug);
};

export const importSkills = (organizationId: string, { skills }: ImportSkillsInput) => {
  const imported = upsertSkills(organizationId, skills);
  return imported.error ? imported : ok({ imported: imported.data });
};
