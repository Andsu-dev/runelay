import { z } from "zod";

const RESERVED_SOURCE_NAMES = ["summary", "import"];

const stringMap = z.record(z.string(), z.string()).default({});

export const sourceStatusSchema = z.enum(["idle", "ok", "error", "needs_auth"]);

export const mcpRemoteConfigSchema = z.object({
  kind: z.literal("mcp"),
  url: z.url(),
  headers: stringMap,
});

export const stdioConfigSchema = z.object({
  kind: z.literal("stdio"),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: stringMap,
});

export const openApiConfigSchema = z.object({
  kind: z.literal("openapi"),
  spec: z.string().min(1),
  baseUrl: z.url().nullable().default(null),
  headers: stringMap,
  query: stringMap,
});

export const sourceConfigSchema = z.discriminatedUnion("kind", [
  mcpRemoteConfigSchema,
  stdioConfigSchema,
  openApiConfigSchema,
]);

export const sourceNameSchema = z
  .string()
  .trim()
  .min(1)
  .transform((name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, ""),
  )
  .pipe(
    z
      .string()
      .min(1, "Nome precisa ter letras ou números")
      .refine((name) => !RESERVED_SOURCE_NAMES.includes(name), "Esse nome é reservado"),
  );

export const createSourceSchema = z.object({
  name: sourceNameSchema,
  config: sourceConfigSchema,
});

export const updateSourceSchema = z
  .object({ config: sourceConfigSchema.optional(), enabled: z.boolean().optional() })
  .refine((body) => body.config !== undefined || body.enabled !== undefined, "Envie config ou enabled");

export const importSourcesSchema = z.union([
  z.object({ sources: z.array(createSourceSchema) }),
  z.object({ config: z.string().min(1) }),
]);
