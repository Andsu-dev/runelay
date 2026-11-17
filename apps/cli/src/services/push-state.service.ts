import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attemptSync, type Result } from "@runelay/shared";
import { PUSH_STATE_FILE } from "@/constants/cli.constants";

const readState = (file: string): Record<string, unknown> => {
  if (!existsSync(file)) return {};
  const parsed = attemptSync(() => JSON.parse(readFileSync(file, "utf8")) as unknown, "INVALID_INPUT");
  return parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)
    ? (parsed.data as Record<string, unknown>)
    : {};
};

export const readLastPush = (file = PUSH_STATE_FILE): number | null => {
  const { lastPushAt } = readState(file);
  return typeof lastPushAt === "number" ? lastPushAt : null;
};

export const recordLastPush = (at = Date.now(), file = PUSH_STATE_FILE): Result<null> =>
  attemptSync(() => {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    writeFileSync(file, `${JSON.stringify({ ...readState(file), lastPushAt: at }, null, 2)}\n`);
    return null;
  }, "STORAGE_FAILED");
