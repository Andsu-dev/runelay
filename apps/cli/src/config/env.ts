import { homedir } from "node:os";
import { parseEnv } from "@runeley/shared";
import { z } from "zod";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());

const cliEnvSchema = z.object({
  RUNELEY_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url()
      .transform((url) => url.replace(/\/$/, ""))
      .optional(),
  ),
  RUNELEY_API_KEY: optionalText,
  RUNELEY_HOME: optionalText.transform((value) => value ?? homedir()),
  RUNELEY_MEMORY_DIR: optionalText,
  RUNELEY_SKILLS_DIR: optionalText,
  XDG_CONFIG_HOME: optionalText,
  RUNELEY_SKIP_KEYCHAIN: z
    .enum(["", "0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const cliEnv = parseEnv(cliEnvSchema);
