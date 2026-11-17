import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { attemptSync, fail, ok, type Result } from "@runelay/shared";
import { z } from "zod";
import { cliEnv } from "@/config/env";
import { CONFIG_DIR, CONFIG_FILE } from "@/constants/cli.constants";
import type { Connection, StoredConfig } from "@/types/config.types";

const storedConfigSchema = z.object({
  url: z.string().min(1),
  apiKey: z.string().min(1),
  organizationName: z.string(),
});

export const readStoredConfig = (): Result<StoredConfig | null> => {
  if (!existsSync(CONFIG_FILE)) return ok(null);
  const raw = attemptSync(() => JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as unknown, "INVALID_INPUT");
  if (raw.error) return fail("INVALID_INPUT", `Couldn't read ${CONFIG_FILE}. Run runelay login again.`);
  const parsed = storedConfigSchema.safeParse(raw.data);
  return parsed.success
    ? ok(parsed.data)
    : fail("INVALID_INPUT", `${CONFIG_FILE} is incomplete. Run runelay login.`);
};

export const saveConfig = (config: StoredConfig): Result<null> =>
  attemptSync(() => {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
    chmodSync(CONFIG_FILE, 0o600);
    return null;
  }, "STORAGE_FAILED");

export const clearConfig = (): Result<null> =>
  attemptSync(() => {
    rmSync(CONFIG_FILE, { force: true });
    return null;
  }, "STORAGE_FAILED");

export const resolveConnection = (): Result<Connection> => {
  const stored = readStoredConfig();
  if (stored.error) return stored;
  const url = cliEnv.RUNELAY_URL ?? stored.data?.url;
  const apiKey = cliEnv.RUNELAY_API_KEY ?? stored.data?.apiKey;
  if (!url || !apiKey) return fail("UNAUTHORIZED", "You're not logged in. Run runelay login first.");
  return ok({ url, apiKey, fromEnv: Boolean(cliEnv.RUNELAY_URL || cliEnv.RUNELAY_API_KEY) });
};
