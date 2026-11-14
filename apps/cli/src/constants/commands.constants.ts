import type { Result } from "@runelay/shared";
import { connectCommand } from "@/commands/connect.command";
import { importCommand } from "@/commands/import.command";
import { loginCommand } from "@/commands/login.command";
import { logoutCommand } from "@/commands/logout.command";
import { migrateCommand } from "@/commands/migrate.command";
import { pullCommand } from "@/commands/pull.command";
import { pushCommand } from "@/commands/push.command";
import { statusCommand } from "@/commands/status.command";
import { syncCommand } from "@/commands/sync.command";

export const COMMANDS: Record<string, (args: string[]) => Promise<Result<null>>> = {
  migrate: migrateCommand,
  login: loginCommand,
  status: statusCommand,
  push: pushCommand,
  pull: pullCommand,
  sync: syncCommand,
  connect: connectCommand,
  import: importCommand,
  logout: logoutCommand,
  "import-context": pushCommand,
  "sync-context": pullCommand,
  "install-clients": connectCommand,
};
