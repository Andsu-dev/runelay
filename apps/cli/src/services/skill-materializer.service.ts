import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import {
  attemptSync,
  ok,
  type Result,
  type SkillFileView,
  type SkillListItemView,
  type SkillView,
} from "@runeley/shared";
import { SKILL_FETCH_CONCURRENCY, SKILL_MARKER_FILE, SKILLS_TARGET_DIR } from "@/constants/cli.constants";
import { SKILL_ENTRY_FILE, SKILL_SOURCES } from "@/constants/context.constants";
import { mapWithConcurrency } from "@/lib/concurrency";
import { listLocalSkillSlugs } from "@/services/context-reader.service";
import { fetchSkill, fetchSkillFile, listEnabledSkills } from "@/services/runeley-api.service";
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

const entryOf = ({ name, description, body }: SkillView) =>
  `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\n---\n\n${body.trim()}\n`;

const replaceFolder = (target: string, skill: SkillView, files: SkillFileView[]) =>
  attemptSync(() => {
    const staging = `${target}.runeley-tmp`;
    rmSync(staging, { recursive: true, force: true });
    mkdirSync(staging, { recursive: true });
    writeFileSync(join(staging, SKILL_ENTRY_FILE), entryOf(skill));
    for (const file of files) {
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

const writeSkill = async (connection: Connection, slug: string, target: string): Promise<Result<null>> => {
  const detail = await fetchSkill(connection, slug);
  if (detail.error) return detail;
  const files: SkillFileView[] = [];
  for (const file of detail.data.files) {
    if (file.path === SKILL_ENTRY_FILE || file.path === SKILL_MARKER_FILE) continue;
    const content = await fetchSkillFile(connection, slug, file.path);
    if (content.error) return content;
    files.push(content.data);
  }
  return replaceFolder(target, detail.data, files);
};

const pullSkill = async (
  connection: Connection,
  skill: SkillListItemView,
  localSlugs: Set<string>,
): Promise<SkillPullResult> => {
  const target = insideOf(SKILLS_TARGET_DIR, skill.slug);
  if (!target) return { slug: skill.slug, outcome: "failed", message: "nome de pasta inválido" };
  const exists = existsSync(target);
  const marker = exists ? markerOf(target) : null;
  if ((exists && marker === null) || (!exists && localSlugs.has(skill.slug)))
    return { slug: skill.slug, outcome: "local" };
  if (marker === skill.updatedAt) return { slug: skill.slug, outcome: "unchanged" };
  const written = await writeSkill(connection, skill.slug, target);
  if (written.error) return { slug: skill.slug, outcome: "failed", message: written.error.message };
  return { slug: skill.slug, outcome: exists ? "updated" : "created" };
};

export const materializeSkills = async (connection: Connection): Promise<Result<SkillPullResult[]>> => {
  const skills = await listEnabledSkills(connection);
  if (skills.error) return skills;
  const created = attemptSync(() => mkdirSync(SKILLS_TARGET_DIR, { recursive: true }), "STORAGE_FAILED");
  if (created.error) return created;
  const localSlugs = listLocalSkillSlugs(SKILL_SOURCES.map((source) => source.path));
  return ok(
    await mapWithConcurrency(skills.data, SKILL_FETCH_CONCURRENCY, (skill) => pullSkill(connection, skill, localSlugs)),
  );
};
