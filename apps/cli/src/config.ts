import { homedir } from "node:os";
import { parseEnv } from "@runeley/shared";
import { z } from "zod";

const cliEnvSchema = z.object({
  RUNELEY_URL: z
    .url()
    .default("http://localhost:4312")
    .transform((url) => url.replace(/\/$/, "")),
  RUNELEY_API_KEY: z.string().min(1, "RUNELEY_API_KEY é obrigatório (crie no painel)"),
  RUNELEY_HOME: z.string().default(homedir()),
  RUNELEY_MEMORY_DIR: z.string().optional(),
  RUNELEY_SKILLS_DIR: z.string().optional(),
});

export const cliEnv = parseEnv(cliEnvSchema);
