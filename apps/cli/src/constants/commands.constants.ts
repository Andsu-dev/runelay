import type { Result } from "@runelay/shared";
import { connectCommand } from "@/commands/connect.command";
import { doctorCommand } from "@/commands/doctor.command";
import { importCommand } from "@/commands/import.command";
import { loginCommand } from "@/commands/login.command";
import { logoutCommand } from "@/commands/logout.command";
import { migrateCommand } from "@/commands/migrate.command";
import { openCommand } from "@/commands/open.command";
import { pullCommand } from "@/commands/pull.command";
import { pushCommand } from "@/commands/push.command";
import { setupCommand } from "@/commands/setup.command";
import { sponsorCommand } from "@/commands/sponsor.command";
import { statusCommand } from "@/commands/status.command";
import { syncCommand } from "@/commands/sync.command";
import { COMMAND_ALIASES, type GuideName } from "@/constants/cli.constants";

export type CommandRunner = (args: string[]) => Promise<Result<null>>;

export const PRIMARY_COMMANDS: Record<Exclude<GuideName, "help">, CommandRunner> = {
  setup: setupCommand,
  migrate: migrateCommand,
  login: loginCommand,
  status: statusCommand,
  open: openCommand,
  push: pushCommand,
  pull: pullCommand,
  sync: syncCommand,
  connect: connectCommand,
  import: importCommand,
  doctor: doctorCommand,
  logout: logoutCommand,
  sponsor: sponsorCommand,
};

export const COMMANDS: Record<string, CommandRunner> = {
  ...PRIMARY_COMMANDS,
  ...Object.fromEntries(
    Object.entries(COMMAND_ALIASES).map(([alias, target]): [string, CommandRunner] => [
      alias,
      PRIMARY_COMMANDS[target],
    ]),
  ),
};
