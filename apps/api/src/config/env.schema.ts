import { z } from "zod";

const flag = z
  .enum(["true", "false", "1", "0"])
  .default("false")
  .transform((value) => value === "true" || value === "1");

const flagOn = z
  .enum(["true", "false", "1", "0"])
  .default("true")
  .transform((value) => value === "true" || value === "1");

export const serverEnvSchema = z.object({
  PUBLIC_URL: z
    .url()
    .default("http://localhost:4312")
    .transform((url) => url.replace(/\/$/, "")),
  RUNELAY_SECRET: z.string().min(32, "RUNELAY_SECRET precisa de 32+ caracteres"),
  RUNELAY_DATA: z.string().default("./data"),
  ALLOW_SIGNUP: flag,
  RUNELAY_ENABLE_EXECUTE: flagOn,
  RUNELAY_ENABLE_STDIO: flag,
  RUNELAY_ALLOW_PRIVATE_URLS: flag,
  RUNELAY_SETUP_TOKEN: z.string().min(16).optional(),
  RUNELAY_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().min(1).default(240),
  RUNELAY_DESKTOP: flag,
  RUNELAY_UPDATER_URL: z.url().optional(),
  RUNELAY_UPDATER_TOKEN: z.string().min(16).optional(),
  RUNELAY_OAUTH_BROKER_URL: z
    .url()
    .default("https://auth.runelay.com")
    .transform((url) => url.replace(/\/$/, "")),
  RUNELAY_GOOGLE_CLIENT_ID: z.string().optional(),
  RUNELAY_GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  WEB_DIST: z.string().default("../web/dist"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().default(4312),
});
