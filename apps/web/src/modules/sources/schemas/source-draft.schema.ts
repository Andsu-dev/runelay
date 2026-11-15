import { sourceConfigSchema } from "@runelay/shared";
import { z } from "zod";
import { parseKeyValueLines } from "@/modules/sources/utils/key-value-lines";

export const sourceDraftSchema = z
  .object({
    kind: z.enum(["mcp", "stdio", "openapi"]),
    url: z.string().trim(),
    command: z.string().trim(),
    spec: z.string().trim(),
    baseUrl: z.string().trim(),
    headers: z.string(),
    env: z.string(),
    oauthClientId: z.string(),
    oauthClientSecret: z.string(),
  })
  .transform((draft): z.input<typeof sourceConfigSchema> => {
    const headers = parseKeyValueLines(draft.headers, ":");
    if (draft.kind === "openapi") {
      return { kind: "openapi", spec: draft.spec, baseUrl: draft.baseUrl || null, headers };
    }
    if (draft.kind === "stdio") {
      const [command = "", ...args] = draft.command.split(/\s+/).filter(Boolean);
      return { kind: "stdio", command, args, env: parseKeyValueLines(draft.env, "=") };
    }
    return { kind: "mcp", url: draft.url, headers };
  })
  .pipe(sourceConfigSchema);

export type SourceDraft = z.input<typeof sourceDraftSchema>;
