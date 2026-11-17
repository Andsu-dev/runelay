import type {
  CreateSkillInput,
  ImportSkillsInput,
  Result,
  SkillFileInput,
  SkillView,
  SkillWriteInput,
  UpdateSkillInput,
} from "@runelay/shared";
import {
  findSkill,
  insertSkill,
  skillExists,
  updateSkillRow,
  upsertSkillFile,
  upsertSkills,
} from "@/modules/skills/repositories/skill.repository";

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

export const writeSkill = (organizationId: string, { slug, ...fields }: SkillWriteInput): Result<SkillView> => {
  const exists = skillExists(organizationId, slug);
  if (exists.error) return exists;
  if (exists.data) return updateSkill(organizationId, slug, fields);
  return createSkill(organizationId, {
    slug,
    name: fields.name ?? slug,
    description: fields.description ?? "",
    body: fields.body,
    enabled: true,
    files: [],
  });
};

export const writeSkillFile = (organizationId: string, slug: string, file: SkillFileInput): Result<SkillView> => {
  const written = upsertSkillFile(organizationId, slug, file);
  return written.error ? written : findSkill(organizationId, slug);
};

export const importSkills = (organizationId: string, { skills }: ImportSkillsInput) =>
  upsertSkills(organizationId, skills);
