import type { Result } from "@runeley/shared";
import packageJson from "../package.json";

const run = async () => {
  const [name = "help", ...args] = process.argv.slice(2);
  if (name === "--version" || name === "-v" || name === "version") {
    console.log(packageJson.version);
    return;
  }
  const { HELP_TEXT } = await import("@/constants/cli.constants");
  const { red } = await import("@/lib/terminal");
  const { COMMANDS } = await import("@/constants/commands.constants");
  const command = COMMANDS[name];
  if (!command) {
    console.log(HELP_TEXT);
    if (!["help", "--help", "-h"].includes(name)) process.exitCode = 1;
    return;
  }
  const result: Result<null> = await command(args);
  if (result.error) {
    console.error(red(result.error.message));
    process.exitCode = 1;
  }
};

await run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
