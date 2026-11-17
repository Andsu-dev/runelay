import { fail, ok, type Result } from "@runelay/shared";
import { runConnect, withKeyNames } from "@/commands/connect.command";
import { checkSetup } from "@/commands/doctor.command";
import { signIn } from "@/commands/login.command";
import { describePushCounts } from "@/commands/push.command";
import { cliEnv } from "@/config/env";
import { ARCHIVE_DIR } from "@/constants/agent-memory.constants";
import { CLIENT_AGENT_LABELS, type ClientId } from "@/constants/clients.constants";
import { CLAUDE_PROJECTS_DIR, EXTRA_MEMORY_SOURCES } from "@/constants/context.constants";
import { openBrowser } from "@/lib/browser";
import { printJson, wantsJson } from "@/lib/json-output";
import { normalizeMcpUrl } from "@/lib/url";
import { plural, shortPath } from "@/lib/format";
import { ask, bold, dim, fileLink, hyperlink, interactive, mark } from "@/lib/terminal";
import { formatNote, formatRow, printCard, startStep } from "@/lib/ui";
import { buildAgentReports, toCheckReport } from "@/services/agent-report.service";
import { removeMigratedServers, scanClientConfigs } from "@/services/client-config.service";
import { resolveConnection } from "@/services/config.service";
import { collectContext } from "@/services/context-collector.service";
import { listMemoryDirectories } from "@/services/context-reader.service";
import { pushContext } from "@/services/context-push.service";
import {
  EMPTY_KEYCHAIN_PLAN,
  planKeychainReads,
  readKeychainCredentials,
  scanFileCredentials,
  wantedKeychainSources,
} from "@/services/credential-reader.service";
import { archiveImportedMemories } from "@/services/memory-archive.service";
import { planMigration } from "@/services/migration-plan.service";
import { recordLastPush } from "@/services/push-state.service";
import { fetchStatus, listSourcesByStatus, pushSources } from "@/services/runelay-api.service";
import type { CollectedContext } from "@/types/collect.types";
import type { Connection } from "@/types/config.types";
import type { MigrateReport } from "@/types/json-report.types";
import type { MigrationPlan } from "@/types/migration.types";

export const keychainNotice = (prompts: number) =>
  `macOS will ask for Keychain access for ${plural(prompts, "account", "accounts")} — choose "Always Allow". Tokens go only to your runelay, encrypted.`;

const connectedIdentities = async (connection: Connection) => {
  const connected = await listSourcesByStatus(connection, "ok");
  return new Set(
    (connected.data ?? []).flatMap(({ config }) => (config.kind === "mcp" ? [normalizeMcpUrl(config.url)] : [])),
  );
};

const hasLogin = (planned: MigrationPlan["sources"][number]) =>
  Boolean(planned.credential) || Object.keys(headersOf(planned)).length > 0;

const joinNames = (names: string[]) => (names.length ? `: ${names.join(", ")}` : "");

const printSummary = (plan: MigrationPlan, context: CollectedContext) => {
  const agents = new Set([...plan.sources.map((planned) => planned.agent), ...context.lines.map((line) => line.agent)]);
  console.log(`\n${bold("What goes to your runelay account")}`);
  for (const agent of agents) {
    const sources = plan.sources.filter((planned) => planned.agent === agent);
    const connected = sources.filter(hasLogin);
    const lines = context.lines.filter((line) => line.agent === agent);
    const count = (kind: string) =>
      lines.filter((line) => line.kind === kind).reduce((total, line) => total + line.added, 0);
    const parts = [
      sources.length
        ? `${plural(sources.length, "account", "accounts")} (${connected.length} signed in${joinNames(connected.map((planned) => planned.source.name))})`
        : "",
      count("memories") ? plural(count("memories"), "memory", "memories") : "",
      count("skills") ? plural(count("skills"), "skill", "skills") : "",
      count("instructions") ? "global instructions" : "",
    ].filter(Boolean);
    if (parts.length) console.log(formatRow({ tone: "info", name: agent, message: parts.join(" · ") }));
  }
  const withLogin = plan.sources.filter(hasLogin).length;
  const instructions = context.lines.filter((line) => line.kind === "instructions").length;
  console.log(
    `\n  ${bold("Total")} ${plural(plan.sources.length, "account", "accounts")} (${withLogin} signed in, ${plan.sources.length - withLogin} may ask for a login) · ${plural(context.memories.length - instructions, "memory", "memories")} · ${plural(context.skills.length, "skill", "skills")} · ${plural(instructions, "instruction file", "instruction files")}`,
  );
  if (plan.localCommands.length)
    console.log(formatNote(`Stay in the agent (local command, dashboard only)${joinNames(plan.localCommands)}`));
};

const headersOf = ({ source }: MigrationPlan["sources"][number]) =>
  source.config.kind === "stdio" || source.config.kind === "google" ? {} : source.config.headers;

export const PROCEED_QUESTION = "Send everything to your runelay account?";

const askToProceed = async (yes: boolean, replace: boolean) => {
  if (yes) return { proceed: true, replace };
  const answer = await ask(`${PROCEED_QUESTION} ${dim("(Enter = yes)")}`);
  return { proceed: !/^n/i.test(answer), replace };
};

const migratedNamesByClient = (plan: MigrationPlan, imported: Set<string>) => {
  const identities = new Set(
    plan.sources.filter((planned) => imported.has(planned.source.name)).map((planned) => planned.identity),
  );
  return new Map(
    [...plan.namesByClient].map(([client, entries]): [ClientId, Set<string>] => [
      client,
      new Set(entries.filter((entry) => identities.has(entry.identity)).map((entry) => entry.name)),
    ]),
  );
};

const sendEverything = async (connection: Connection, plan: MigrationPlan, context: CollectedContext) => {
  const accounts = startStep(`Sending ${plural(plan.sources.length, "account", "accounts")} and connecting`);
  const sources = await pushSources(
    connection,
    plan.sources.map((planned) => planned.source),
  );
  if (sources.error) {
    accounts.fail(sources.error.message);
    return sources;
  }
  for (const name of sources.data.connected) accounts.row(formatRow({ tone: "ok", name, message: "connected" }));
  for (const skipped of sources.data.skipped)
    accounts.row(formatRow({ tone: "skip", name: skipped.name, message: `skipped, ${skipped.reason}` }));
  accounts.done(`${plural(sources.data.imported.length, "account", "accounts")} · ${sources.data.connected.length} connected`);

  const sending = startStep(
    `Sending ${plural(context.memories.length, "memory", "memories")} and ${plural(context.skills.length, "skill", "skills")}`,
  );
  const pushed = await pushContext(connection, context.memories, context.skills);
  if (pushed.error) {
    sending.fail(pushed.error.message);
    return pushed;
  }
  const { memories, skills } = pushed.data;
  const skipped = [...memories.skipped, ...skills.skipped];
  if (skipped.length) sending.row(formatNote(`newer on the server, kept: ${skipped.join(", ")}`));
  sending.done(`${memories.written + skills.written} sent · ${skipped.length} skipped`);
  return ok({
    ...sources.data,
    memories,
    skills,
    memoriesImported: memories.written,
    skillsImported: skills.written,
    skippedMemoryList: memories.skipped,
    skippedSkillList: skills.skipped,
    unchangedMemoryList: memories.unchanged,
    unchangedSkillList: skills.unchanged,
    skippedMemories: new Set(memories.skipped),
  });
};

const NOTHING_ARCHIVED: MigrateReport["archived"] = { path: null, moved: 0, kept: [] };

const archiveLocalMemories = (context: CollectedContext, skipped: Set<string>): MigrateReport["archived"] => {
  if (cliEnv.RUNELAY_MEMORY_DIR) return NOTHING_ARCHIVED;
  const archived = archiveImportedMemories({
    sent: context.memories.filter((memory) => !skipped.has(memory.slug)),
    directories: [
      ...listMemoryDirectories(CLAUDE_PROJECTS_DIR, ""),
      ...EXTRA_MEMORY_SOURCES.map((source) => source.path),
    ],
    home: cliEnv.RUNELAY_HOME,
    archiveRoot: ARCHIVE_DIR,
    now: new Date(),
  });
  if (archived.error) {
    console.log(formatRow({ tone: "error", name: "Archive", message: `local memory stayed in place: ${archived.error.message}` }));
    return NOTHING_ARCHIVED;
  }
  const { archiveDir, moved, kept } = archived.data;
  if (archiveDir)
    console.log(
      formatRow({
        tone: "ok",
        name: "Archive",
        message: `${plural(moved.length, "local memory folder", "local memory folders")} moved to ${fileLink(archiveDir, shortPath(archiveDir, cliEnv.RUNELAY_HOME))}`,
      }),
    );
  for (const directory of kept) console.log(formatNote(`kept (has content that wasn't sent): ${directory}`));
  return { path: archiveDir ?? null, moved: moved.length, kept };
};

const describeOrganization = async (connection: Connection) => {
  const status = await fetchStatus(connection);
  return status.data?.organizationName ?? connection.url;
};

export interface MigrateOptions {
  connectAgents?: boolean;
  checkAfter?: boolean;
  report?: boolean;
  verbose?: boolean;
}

export interface MigrationOutcome {
  organizationName: string;
  imported: MigrateReport["imported"];
  memories: string;
  skills: string;
  pendingLogins: string[];
  reconnectUrl: string | null;
}

export const runMigration = async (
  args: string[],
  { connectAgents = true, checkAfter = true, report = true, verbose = true }: MigrateOptions = {},
): Promise<Result<MigrationOutcome | null>> => {
  const json = wantsJson(args);
  const yes = args.includes("--yes") || args.includes("-y") || json;
  const replaceFlag = args.includes("--replace");
  const urlArgument = args.find((arg) => !arg.startsWith("-"));
  if (!interactive && !yes) return fail("INVALID_INPUT", "No interactive terminal. Run runelay migrate --yes.");

  let connection = resolveConnection();
  if (connection.error) {
    if (json) return connection;
    const logged = await signIn(urlArgument);
    if (logged.error) return logged;
    connection = resolveConnection();
    if (connection.error) return connection;
  }
  const organizationName = await describeOrganization(connection.data);

  const useKeychain = process.platform === "darwin" && !cliEnv.RUNELAY_SKIP_KEYCHAIN;
  const clients = scanClientConfigs();
  const scan = scanFileCredentials(useKeychain);
  const keychain = useKeychain
    ? planKeychainReads(
        wantedKeychainSources(clients.sources, await connectedIdentities(connection.data), scan.credentials),
      )
    : EMPTY_KEYCHAIN_PLAN;
  if (keychain.prompts) console.log(formatNote(keychainNotice(keychain.prompts)));
  const scanning = startStep("Scanning your agents");
  const plan = planMigration(clients.sources, [...scan.credentials, ...readKeychainCredentials(keychain)]);
  const context = collectContext();
  for (const error of clients.errors) scanning.row(formatNote(error));
  for (const note of [...scan.notes, ...(verbose ? scan.verboseNotes : [])]) scanning.row(formatNote(note));
  scanning.done(`${plural(plan.sources.length, "account", "accounts")} · ${plural(context.memories.length, "memory", "memories")} · ${plural(context.skills.length, "skill", "skills")}`);
  printSummary(plan, context);

  const { proceed, replace } = await askToProceed(yes, replaceFlag);
  if (!proceed) {
    console.log(`${mark.meta} Nothing was sent.`);
    return ok(null);
  }
  console.log("");

  const sent = await sendEverything(connection.data, plan, context);
  if (sent.error) return sent;
  const recorded = recordLastPush();
  if (recorded.error) console.log(formatNote(`couldn't record the push time: ${recorded.error.message}`));
  const archived = archiveLocalMemories(context, sent.data.skippedMemories);

  const connected = connectAgents ? await runConnect(connection.data) : null;
  if (replace) {
    for (const [client, removed] of removeMigratedServers(migratedNamesByClient(plan, new Set(sent.data.imported)))) {
      if (removed.error) console.log(formatRow({ tone: "error", name: CLIENT_AGENT_LABELS[client], message: removed.error.message }));
      else if (removed.data)
        console.log(formatRow({ tone: "ok", name: CLIENT_AGENT_LABELS[client], message: `${removed.data} direct MCPs removed` }));
    }
  }

  const rotated = plan.sources.filter(
    (planned) => planned.credential?.refreshToken && sent.data.imported.includes(planned.source.name),
  );
  for (const planned of rotated)
    console.log(formatNote(`${planned.source.name}: the provider may rotate the token, and ${planned.agent} may ask for a login again.`));

  const pending = await listSourcesByStatus(connection.data, "needs_auth");
  const pendingNames = pending.data?.map((source) => source.name) ?? [];
  const setup = checkAfter ? checkSetup() : null;
  const reconnectUrl = `${connection.data.url}/connectors/reconnect`;
  const imported = {
    sources: sent.data.imported.length,
    connected: sent.data.connected.length,
    memories: sent.data.memoriesImported,
    skills: sent.data.skillsImported,
  };
  const outcome: MigrationOutcome = {
    organizationName,
    imported,
    memories: describePushCounts(sent.data.memories),
    skills: describePushCounts(sent.data.skills),
    pendingLogins: pendingNames,
    reconnectUrl: pendingNames.length ? reconnectUrl : null,
  };
  if (!report) return ok(outcome);
  if (json) {
    printJson({
      command: "migrate",
      ok: true,
      sent: true,
      organizationName,
      imported,
      skipped: {
        sources: sent.data.skipped.map((skipped) => skipped.name),
        memories: sent.data.skippedMemoryList,
        skills: sent.data.skippedSkillList,
      },
      unchanged: {
        memories: sent.data.unchangedMemoryList,
        skills: sent.data.unchangedSkillList,
      },
      pendingLogins: pendingNames,
      reconnectUrl: pendingNames.length ? reconnectUrl : null,
      keychainPrompts: keychain.prompts,
      archived,
      agents: withKeyNames(buildAgentReports(), connected?.agents),
      checks: (setup?.checks ?? []).map(toCheckReport),
    } satisfies MigrateReport);
  }
  const warnings = (setup?.warnings ?? 0) + (connected?.warnings ?? 0);
  const firstFix = setup?.checks.find((check) => check.status === "warn" && check.fix)?.fix;
  printCard({
    title: "Migrated to your runelay account",
    stats: [
      [
        "Accounts",
        `${sent.data.imported.length} sent · ${sent.data.connected.length} connected${pendingNames.length ? ` · ${pendingNames.length} need a login` : ""}`,
      ],
      ["Memories", describePushCounts(sent.data.memories)],
      ["Skills", describePushCounts(sent.data.skills)],
      ...(connected ? [["Agents", `${connected.registered} using runelay`] as [string, string]] : []),
      ...(archived.path
        ? [["Archive", fileLink(archived.path, shortPath(archived.path, cliEnv.RUNELAY_HOME))] as [string, string]]
        : []),
      ["Warnings", String(warnings)],
    ],
    next: pendingNames.length
      ? `sign in to ${joinNames(pendingNames).slice(2)} at ${hyperlink(reconnectUrl, reconnectUrl)}`
      : (firstFix ?? (checkAfter ? "runelay status" : "runelay doctor")),
  });
  if (!json && pendingNames.length && openBrowser(reconnectUrl))
    console.log(dim(`  Opened ${hyperlink(reconnectUrl, reconnectUrl)}`));
  return ok(outcome);
};

export const migrateCommand = async (args: string[]): Promise<Result<null>> => {
  const migrated = await runMigration(args);
  return migrated.error ? migrated : ok(null);
};
