import type { AppError, Result } from "@runelay/shared";
import type { ErrorHint } from "@/constants/ui.constants";
import packageJson from "../package.json";

const GLOBAL_FLAGS = ["--no-motion", "--verbose"];

const reportError = async (
  error: Pick<AppError, "code" | "message">,
  command: string | undefined,
  { stack, hint }: { stack?: string; hint?: ErrorHint } = {},
) => {
  const { printJson, wantsJson } = await import("@/lib/json-output");
  const { decorated, red } = await import("@/lib/terminal");
  const verbose = process.argv.includes("--verbose");
  process.exitCode = 1;
  if (wantsJson(process.argv)) {
    console.error(error.message);
    printJson({ ok: false, error: { code: error.code, message: error.message } });
    return;
  }
  if (!decorated || !process.stderr.isTTY) {
    console.error(red(error.message));
    if (verbose && stack) console.error(stack);
    return;
  }
  const { describeError, renderErrorBox } = await import("@/lib/ui");
  const view = describeError(error, command, hint);
  const details = verbose ? [`code: ${error.code}`, ...(stack ? [stack] : [])].join("\n") : undefined;
  console.error(`\n${renderErrorBox({ ...view, details }).join("\n")}\n`);
};

const run = async () => {
  const argv = process.argv.slice(2).filter((arg) => !GLOBAL_FLAGS.includes(arg));
  const [name, ...args] = argv;
  const { BANNER_COMMANDS, HELP_NAMES, VERSION_NAMES } = await import("@/constants/cli.constants");
  if (name && VERSION_NAMES.includes(name)) {
    console.log(packageJson.version);
    return;
  }
  const { interactive, decorated } = await import("@/lib/terminal");
  if (!name && interactive) {
    const { homeCommand } = await import("@/commands/home.command");
    const result = await homeCommand(packageJson.version);
    if (result.error) await reportError(result.error, undefined);
    return;
  }
  const { renderHelp } = await import("@/lib/help");
  if (!name || HELP_NAMES.includes(name)) {
    const { printBanner, sponsorLine } = await import("@/lib/banner");
    if (decorated) {
      const { dim } = await import("@/lib/terminal");
      await printBanner(packageJson.version);
      console.log(`  ${dim(sponsorLine())}\n`);
    }
    console.log(renderHelp());
    return;
  }
  const { COMMANDS } = await import("@/constants/commands.constants");
  const command = COMMANDS[name];
  if (!command) {
    const { UNKNOWN_COMMAND_HINT } = await import("@/constants/ui.constants");
    if (!decorated) console.log(renderHelp());
    await reportError({ code: "NOT_FOUND", message: `Unknown command "${name}".` }, undefined, {
      hint: UNKNOWN_COMMAND_HINT,
    });
    return;
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(renderHelp());
    return;
  }
  const { sendLogsToStderr, wantsJson } = await import("@/lib/json-output");
  if (wantsJson(args)) sendLogsToStderr();
  else if (BANNER_COMMANDS.includes(name)) {
    const { printCompactBanner } = await import("@/lib/banner");
    printCompactBanner(packageJson.version);
  }
  const result: Result<null> = await command(args);
  if (result.error) await reportError(result.error, name);
};

await run().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  await reportError({ code: "INTERNAL", message }, process.argv[2], { stack }).catch(() => {
    console.error(message);
    process.exitCode = 1;
  });
});
