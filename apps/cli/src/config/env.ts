import { homedir } from "node:os";
import { parseEnv } from "@runelay/shared";
import { z } from "zod";

const optionalText = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());

const cliEnvSchema = z.object({
  RUNELAY_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url()
      .transform((url) => url.replace(/\/$/, ""))
      .optional(),
  ),
  RUNELAY_API_KEY: optionalText,
  RUNELAY_HOME: optionalText.transform((value) => value ?? homedir()),
  RUNELAY_MEMORY_DIR: optionalText,
  RUNELAY_SKILLS_DIR: optionalText,
  XDG_CONFIG_HOME: optionalText,
  RUNELAY_SKIP_KEYCHAIN: z
    .enum(["", "0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

export const cliEnv = parseEnv(cliEnvSchema);
