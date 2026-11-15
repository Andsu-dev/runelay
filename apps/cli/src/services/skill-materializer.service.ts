import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import {
  attemptSync,
  ok,
  type Result,
  SKILL_EXPORT_LIMIT,
  type SkillExportView,
  type SkillListItemView,
} from "@runelay/shared";
import { SKILL_MARKER_FILE, SKILLS_TARGET_DIR } from "@/constants/cli.constants";
import { SKILL_ENTRY_FILE, SKILL_SOURCES } from "@/constants/context.constants";
import { chunk } from "@/lib/chunk";
import { listLocalSkillSlugs } from "@/services/context-reader.service";
import { exportSkills, listEnabledSkills } from "@/services/runelay-api.service";
import type { Connection } from "@/types/config.types";
import type { SkillPullResult } from "@/types/skill-pull.types";

const markerOf = (directory: string) => {
  const marker = join(directory, SKILL_MARKER_FILE);
  return existsSync(marker) ? readFileSync(marker, "utf8").trim() : null;
};

const insideOf = (root: string, path: string) => {
  const target = resolve(root, path);
  return target.startsWith(`${resolve(root)}${sep}`) ? target : null;
};

const entryOf = ({ name, description, body }: SkillExportView) =>
  `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\n---\n\n${body.trim()}\n`;

const replaceFolder = (target: string, skill: SkillExportView) =>
  attemptSync(() => {
    const staging = `${target}.runelay-tmp`;
    rmSync(staging, { recursive: true, force: true });
    mkdirSync(staging, { recursive: true });
    writeFileSync(join(staging, SKILL_ENTRY_FILE), entryOf(skill));
    for (const file of skill.files) {
      if (file.path === SKILL_ENTRY_FILE || file.path === SKILL_MARKER_FILE) continue;
      const path = insideOf(staging, file.path);
      if (!path) continue;
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, file.content);
    }
    writeFileSync(join(staging, SKILL_MARKER_FILE), `${skill.updatedAt}\n`);
    rmSync(target, { recursive: true, force: true });
    renameSync(staging, target);
    return null;
  }, "STORAGE_FAILED");

type PendingSkill = { skill: SkillListItemView; target: string; exists: boolean };

type PullPlan = PendingSkill | SkillPullResult;

const planSkill = (skill: SkillListItemView, localSlugs: Set<string>): PullPlan => {
  const target = insideOf(SKILLS_TARGET_DIR, skill.slug);
  if (!target) return { slug: skill.slug, outcome: "failed", message: "nome de pasta inválido" };
  const exists = existsSync(target);
  const marker = exists ? markerOf(target) : null;
  if ((exists && marker === null) || (!exists && localSlugs.has(skill.slug)))
    return { slug: skill.slug, outcome: "local" };
  if (marker === skill.updatedAt) return { slug: skill.slug, outcome: "unchanged" };
  return { skill, target, exists };
};

const writeBatch = async (connection: Connection, batch: PendingSkill[]): Promise<SkillPullResult[]> => {
  const exported = await exportSkills(
    connection,
    batch.map(({ skill }) => skill.slug),
  );
  if (exported.error)
    return batch.map(({ skill }) => ({ slug: skill.slug, outcome: "failed", message: exported.error.message }));
  const bySlug = new Map(exported.data.map((skill) => [skill.slug, skill]));
  return batch.map(({ skill, target, exists }) => {
    const full = bySlug.get(skill.slug);
    if (!full) return { slug: skill.slug, outcome: "failed", message: "habilidade sumiu do servidor" };
    const written = replaceFolder(target, full);
    if (written.error) return { slug: skill.slug, outcome: "failed", message: written.error.message };
    return { slug: skill.slug, outcome: exists ? "updated" : "created" };
  });
};

export const materializeSkills = async (connection: Connection): Promise<Result<SkillPullResult[]>> => {
  const skills = await listEnabledSkills(connection);
  if (skills.error) return skills;
  const created = attemptSync(() => mkdirSync(SKILLS_TARGET_DIR, { recursive: true }), "STORAGE_FAILED");
  if (created.error) return created;
  const localSlugs = listLocalSkillSlugs(SKILL_SOURCES.map((source) => source.path));
  const plans = skills.data.map((skill) => planSkill(skill, localSlugs));
  const settled = plans.filter((plan): plan is SkillPullResult => "outcome" in plan);
  const pending = plans.filter((plan): plan is PendingSkill => !("outcome" in plan));
  const written: SkillPullResult[] = [];
  for (const batch of chunk(pending, SKILL_EXPORT_LIMIT)) written.push(...(await writeBatch(connection, batch)));
  return ok([...settled, ...written]);
};
