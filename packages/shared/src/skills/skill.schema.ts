import { z } from "zod";
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

const skillFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  body: z.string().max(200_000),
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
});

export const importSkillsSchema = z.object({
  skills: z.array(createSkillSchema).max(500),
});
