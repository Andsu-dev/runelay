import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  type CreateMemoryInput,
  type CreateSkillInput,
  memoryTypeSchema,
  type SkillFileInput,
  skillSlugSchema,
} from "@runeley/shared";
import {
  BINARY_EXTENSIONS,
  CONTEXT_END_MARKER,
  CONTEXT_START_MARKER,
  LIMITS,
  MEMORY_INDEX_FILE,
  PINNED_SECTION,
  SKILL_ENTRY_FILE,
  SKILL_FILE_MAX_BYTES,
  SKILL_FILES_MAX,
  SKIPPED_DIRECTORIES,
} from "@/constants/context.constants";
import { splitFrontmatter } from "@/lib/frontmatter";
import type { InstructionFile } from "@/types/context.types";

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9:]+/g, "-")
    .replace(/^[-:]+|[-:]+$/g, "");

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const pinnedStems = (directory: string) => {
  const index = join(directory, MEMORY_INDEX_FILE);
  if (!existsSync(index)) return new Set<string>();
  const content = readFileSync(index, "utf8");
  const start = content.indexOf(PINNED_SECTION);
  if (start < 0) return new Set<string>();
  const rest = content.slice(start + PINNED_SECTION.length);
  const end = rest.search(/\n## /);
  const section = end < 0 ? rest : rest.slice(0, end);
  return new Set([...section.matchAll(/\]\(([^)]+?)\.md\)/g)].map((match) => toSlug(basename(match[1] ?? ""))));
};

export const readMemories = (directory: string): CreateMemoryInput[] => {
  if (!existsSync(directory)) return [];
  const pinned = pinnedStems(directory);
  return readdirSync(directory)
    .filter((file) => file.endsWith(".md") && file !== MEMORY_INDEX_FILE)
    .flatMap((file) => {
      const slug = toSlug(file.replace(/\.md$/, "").replace(/:/g, "-"));
      if (!slug) return [];
      const { meta, body } = splitFrontmatter(readFileSync(join(directory, file), "utf8"));
      const metadata = (meta.metadata ?? {}) as Record<string, unknown>;
      const type = memoryTypeSchema.safeParse(metadata.type ?? meta.type);
      return [
        {
          slug,
          name: (text(meta.name) || slug).slice(0, LIMITS.memoryName),
          description: text(meta.description).slice(0, LIMITS.memoryDescription),
          type: type.success ? type.data : "project",
          body: body.trim().slice(0, LIMITS.memoryBody),
          pinned: pinned.has(slug),
        },
      ];
    });
};

const isTextFile = (path: string, size: number) => {
  if (size > SKILL_FILE_MAX_BYTES || BINARY_EXTENSIONS.test(path)) return false;
  return !readFileSync(path).subarray(0, 8000).includes(0);
};

const collectFiles = (root: string, directory: string): SkillFileInput[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (SKIPPED_DIRECTORIES.has(entry.name) || entry.name.startsWith(".")) return [];
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return [];
    if (stats.isDirectory()) return collectFiles(root, path);
    const relativePath = relative(root, path);
    if (relativePath === SKILL_ENTRY_FILE || relativePath.length > LIMITS.filePath) return [];
    if (!stats.isFile() || !isTextFile(path, stats.size)) return [];
    return [{ path: relativePath, content: readFileSync(path, "utf8") }];
  });

export const readSkills = (directory: string): CreateSkillInput[] => {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const root = join(directory, name);
    const entry = join(root, SKILL_ENTRY_FILE);
    if (name.startsWith(".") || !existsSync(entry)) return [];
    const slug = skillSlugSchema.safeParse(toSlug(name));
    if (!slug.success) return [];
    const { meta, body } = splitFrontmatter(readFileSync(entry, "utf8"));
    return [
      {
        slug: slug.data,
        name: (text(meta.name) || name).slice(0, LIMITS.skillName),
        description: text(meta.description).slice(0, LIMITS.skillDescription),
        body: body.trim().slice(0, LIMITS.skillBody),
        enabled: true,
        files: collectFiles(root, root).slice(0, SKILL_FILES_MAX),
      },
    ];
  });
};

const stripManagedBlock = (content: string) => {
  const start = content.indexOf(CONTEXT_START_MARKER);
  const end = content.indexOf(CONTEXT_END_MARKER);
  if (start < 0 || end < start) return content;
  return content.slice(0, start) + content.slice(end + CONTEXT_END_MARKER.length);
};

export const readInstructions = ({ agent, path, slug }: InstructionFile): CreateMemoryInput | null => {
  if (!existsSync(path)) return null;
  const body = stripManagedBlock(readFileSync(path, "utf8")).trim();
  if (!body) return null;
  return {
    slug,
    name: `Instruções globais do ${agent}`,
    description: `Regras que valem em todo projeto no ${agent}, importadas de ${basename(path)}.`,
    type: "feedback",
    body: body.slice(0, LIMITS.memoryBody),
    pinned: true,
  };
};

export const listMemoryDirectories = (projectsDir: string, preferred: string): string[] => {
  if (!existsSync(projectsDir)) return [];
  const directories = readdirSync(projectsDir)
    .map((project) => join(projectsDir, project, "memory"))
    .filter((directory) => existsSync(directory) && statSync(directory).isDirectory())
    .map((directory) => ({ directory, size: readdirSync(directory).length }))
    .sort((a, b) => b.size - a.size)
    .map(({ directory }) => directory);
  return [preferred, ...directories.filter((directory) => directory !== preferred)].filter((directory) =>
    existsSync(directory),
  );
};
