import { importCommand } from "@/commands/import.command";
import { importContextCommand } from "@/commands/import-context.command";
import { installClientsCommand } from "@/commands/install-clients.command";
import { syncContextCommand } from "@/commands/sync-context.command";

const commands: Record<string, () => unknown> = {
  import: importCommand,
  "install-clients": installClientsCommand,
  "import-context": importContextCommand,
  "sync-context": syncContextCommand,
};

const run = commands[process.argv[2] ?? ""];
if (run) await run();
else console.log("uso: runeley import | install-clients | import-context | sync-context");
