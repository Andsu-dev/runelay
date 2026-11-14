import { z } from "zod";

export const contextClientSchema = z.enum(["claude", "codex", "grok", "cursor"]);

export const contextSearchSchema = z.object({
  query: z.string().trim().min(1).max(300),
  kind: z.enum(["memory", "skill"]).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(8),
});

export const contextBriefSchema = z.object({
  client: contextClientSchema.default("claude"),
});
