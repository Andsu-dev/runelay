import { ok, type Result } from "@runelay/shared";
import { runConnect, withKeyNames } from "@/commands/connect.command";
import { checkSetup } from "@/commands/doctor.command";
import { normalizeUrl, signIn } from "@/commands/login.command";
import { runMigration } from "@/commands/migrate.command";
import { describeSkillCounts, runPull } from "@/commands/pull.command";
import { NO_BROWSER_FLAG } from "@/constants/cli.constants";
import { VERBOSE_FLAG } from "@/constants/terminal.constants";
import { sponsorLine } from "@/lib/banner";
import { plural } from "@/lib/format";
import { printJson, wantsJson } from "@/lib/json-output";
import { accent, bold, dim, glyphs, hyperlink } from "@/lib/terminal";
import { formatRow, printCard } from "@/lib/ui";
import { buildAgentReports, toCheckReport } from "@/services/agent-report.service";
import { resolveConnection } from "@/services/config.service";
import type { Connection } from "@/types/config.types";
import type { SetupReport } from "@/types/json-report.types";

export const SETUP_PHASES = ["Signing in", "Connecting your agents", "Bringing what you already have", "Checking everything"];

const phase = (index: number) =>
  console.log(`\n${accent(glyphs.step)} ${dim(`${index + 1}/${SETUP_PHASES.length}`)} ${bold(SETUP_PHASES[index] ?? "")}`);

export const needsSignIn = (connection: Result<Connection>, urlArgument: string | undefined) =>
  Boolean(connection.error) || Boolean(urlArgument && normalizeUrl(urlArgument) !== connection.data?.url);

export const setupCommand = async (args: string[] = []): Promise<Result<null>> => {
  const urlArgument = args.find((arg) => !arg.startsWith("-"));
  const verbose = process.argv.includes(VERBOSE_FLAG);
  phase(0);
  const existing = resolveConnection();
  const signedIn = needsSignIn(existing, urlArgument);
  if (signedIn) {
    const logged = await signIn(urlArgument, { browser: !args.includes(NO_BROWSER_FLAG), discover: true });
    if (logged.error) return logged;
  } else if (existing.data) console.log(formatRow({ tone: "skip", name: "runelay", message: `already signed in to ${existing.data.url}` }));
  const connection = resolveConnection();
  if (connection.error) return connection;

  phase(1);
  const connected = await runConnect(connection.data, { briefs: false, verbose });
  phase(2);
  const migrated = await runMigration(["--yes"], { connectAgents: false, checkAfter: false, report: false, verbose });
  if (migrated.error) return migrated;
  const pulled = await runPull(connection.data);
  phase(3);
  const { checks, warnings: doctorWarnings } = checkSetup({ verbose });

  const panel = connection.data.url;
  const outcome = migrated.data;
  const warnings = connected.warnings + pulled.warnings + doctorWarnings;
  const pending = outcome?.pendingLogins ?? [];
  if (wantsJson(args))
    printJson({
      command: "setup",
      ok: connected.failed === 0 && pulled.warnings === 0,
      url: panel,
      organizationName: outcome?.organizationName ?? panel,
      signedIn,
      imported: outcome?.imported ?? { sources: 0, connected: 0, memories: 0, skills: 0 },
      pendingLogins: pending,
      reconnectUrl: outcome?.reconnectUrl ?? null,
      instructions: pulled.files,
      warnings,
      agents: withKeyNames(buildAgentReports(), connected.agents),
      checks: checks.map(toCheckReport),
      next: panel,
    } satisfies SetupReport);
  printCard({
    title: warnings ? "Set up, with warnings" : "All set. Go back to your browser.",
    stats: [
      ["Agents", `${connected.registered} using runelay${connected.failed ? ` · ${connected.failed} failed` : ""}`],
      [
        "Accounts",
        `${outcome?.imported.sources ?? 0} sent${pending.length ? ` · ${pending.length} need a login` : ""}`,
      ],
      ["Memories", outcome?.memories ?? "nothing sent"],
      ["Skills", `${outcome?.skills ?? "nothing sent"} · pulled ${describeSkillCounts(pulled.counts)}`],
      ["Instructions", `${plural(pulled.files, "agent", "agents")} with the runelay rule`],
      ["Warnings", String(warnings)],
    ],
    next: `open ${hyperlink(panel, panel)}`,
    footer: warnings ? undefined : sponsorLine(),
  });
  return ok(null);
};
