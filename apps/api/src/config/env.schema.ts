import { z } from "zod";

export const serverEnvSchema = z.object({
  PUBLIC_URL: z
    .url()
    .default("http://localhost:4312")
    .transform((url) => url.replace(/\/$/, "")),
  RUNELEY_SECRET: z.string().min(32, "RUNELEY_SECRET precisa de 32+ caracteres"),
  RUNELEY_DATA: z.string().default("./data"),
  ALLOW_SIGNUP: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((value) => value === "true" || value === "1"),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  WEB_DIST: z.string().default("../web/dist"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().default(4312),
});
