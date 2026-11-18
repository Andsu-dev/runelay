import { z } from "zod";
import { pushedAtSchema } from "../memories/memory.schema";
import { paginationSchema } from "../pagination/pagination.schema";

export const skillSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:[-:][a-z0-9]+)*$/, "Use letras minúsculas, números, hífen ou dois-pontos");

export const skillFileSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((path) => !path.startsWith("/") && !path.split("/").includes(".."), "Caminho inválido"),
  content: z.string().max(500_000),
});

export const SKILL_DOCUMENT_LIMIT = 200_000;
export const skillDocumentFilenameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/\.(md|markdown|txt)$/i);

export const uploadSkillSchema = z.object({
  filename: skillDocumentFilenameSchema,
  content: z.string().trim().min(1).max(SKILL_DOCUMENT_LIMIT),
});

const skillFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  body: z.string().max(SKILL_DOCUMENT_LIMIT),
  enabled: z.boolean(),
  files: z.array(skillFileSchema).max(200),
};

export const createSkillSchema = z.object({
  ...skillFields,
  slug: skillSlugSchema,
  description: skillFields.description.default(""),
  enabled: skillFields.enabled.default(true),
  files: skillFields.files.default([]),
});

export const updateSkillSchema = z
  .object(skillFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Envie ao menos um campo");

export const listSkillsSchema = paginationSchema.extend({
  query: z.string().trim().max(200).optional(),
  enabled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const SKILL_EXPORT_LIMIT = 50;

export const exportSkillsSchema = z.object({
  slugs: z.array(skillSlugSchema).min(1).max(SKILL_EXPORT_LIMIT),
});

export const importedSkillSchema = createSkillSchema.extend({ updatedAt: pushedAtSchema.optional() });

export const importSkillsSchema = z.object({
  skills: z.array(importedSkillSchema).max(500),
});

export const skillWriteSchema = z.object({
  slug: skillSlugSchema,
  body: skillFields.body,
  name: skillFields.name.optional(),
  description: skillFields.description.optional(),
});

export const githubSkillSourceSchema = z.object({ source: z.string().trim().min(1).max(500) });

export const installGithubSkillSchema = githubSkillSourceSchema.extend({
  skill: z.string().trim().min(1).max(300).optional(),
});
