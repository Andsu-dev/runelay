import type { Result } from "@runeley/shared";
import { pullCommand } from "@/commands/pull.command";
import { pushCommand } from "@/commands/push.command";

export const syncCommand = async (): Promise<Result<null>> => {
  const pushed = await pushCommand();
  if (pushed.error || process.exitCode) return pushed;
  console.log("");
  return pullCommand();
};
