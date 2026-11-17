import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attemptSync, fail, ok, type Result } from "@runelay/shared";
import { writeInstructionBriefs } from "@/commands/pull.command";
import {
  CLAUDE_SETTINGS_FILE,
  CLIENT_AGENT_LABELS,
  CLIENT_CONFIG_FILES,
  CURSOR_CLI_COMMAND,
  CURSOR_CLI_CONFIG,
  TOML_HEADER_KEYS,
  TOML_RUNELAY_HEADER,
} from "@/constants/clients.constants";
import { getIn, isObject } from "@/lib/json";
import { plural } from "@/lib/format";
import { printJson, wantsJson } from "@/lib/json-output";
import { formatRow, printCard, type Step, startStep } from "@/lib/ui";
import { type AgentKeyDeps, bearerKey, remoteAgentKeyDeps, resolveAgentKey } from "@/services/agent-keys.service";
import { buildAgentReports } from "@/services/agent-report.service";
import { resolveConnection } from "@/services/config.service";
import { installedMcpTargets, readMcpAuthorization, registerMcpTarget } from "@/services/mcp-registration.service";
import { disableNativeMemory, installedManualSteps } from "@/services/native-memory.service";
import { allowClaudeTools, allowCursorTools, codexToolApprovals } from "@/services/tool-approvals.service";
import type { Connection } from "@/types/config.types";
import type { AgentReport } from "@/types/json-report.types";

const RUNELAY_TABLE = /^\[(?!mcp_servers\.runelay[.\]])/m;

export const withTomlBlock = (current: string, block: string) => {
  const start = current.indexOf(TOML_RUNELAY_HEADER);
  if (start < 0) return `${current}${current.endsWith("\n") || !current ? "" : "\n"}\n${block}`;
  const rest = current.slice(start + TOML_RUNELAY_HEADER.length);
  const next = rest.search(RUNELAY_TABLE);
  const tail = next < 0 ? "" : rest.slice(next);
  return `${current.slice(0, start)}${block}${tail ? `\n${tail}` : ""}`;
};

export const tomlAuthorization = (current: string) => {
  const start = current.indexOf(TOML_RUNELAY_HEADER);
  if (start < 0) return null;
  const rest = current.slice(start + TOML_RUNELAY_HEADER.length);
  const next = rest.search(RUNELAY_TABLE);
  return (next < 0 ? rest : rest.slice(0, next)).match(/Authorization\s*=\s*"([^"]+)"/)?.[1] ?? null;
};

export const tomlBlock = (client: keyof typeof TOML_HEADER_KEYS, url: string, authorization: string) =>
  [
    `${TOML_RUNELAY_HEADER}\nurl = "${url}"\n${TOML_HEADER_KEYS[client]} = { Authorization = "${authorization}" }\n`,
    ...(client === "codex" ? [codexToolApprovals()] : []),
  ].join("\n");

export type AgentStatus = "changed" | "unchanged" | "failed";

export interface AgentConnection {
  id: string;
  status: AgentStatus;
  keyName: string | null;
}

export interface ConnectSummary {
  registered: number;
  failed: number;
  memoryOff: number;
  manual: number;
  instructions: number;
  warnings: number;
  agents: AgentConnection[];
}

export const NOW_USES = "now uses runelay";
export const ALREADY_USES = "already uses runelay";

const readOrEmpty = (file: string) => (existsSync(file) ? readFileSync(file, "utf8") : "");

const spawnText = async (command: string[]) => {
  const child = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
  return { exitCode, stderr: stderr.trim() };
};

const readClaudeEntry = () => {
  try {
    const parsed: unknown = JSON.parse(readOrEmpty(CLIENT_CONFIG_FILES.claude) || "{}");
    const entry = isObject(parsed) ? getIn(parsed, "mcpServers.runelay") : undefined;
    if (!isObject(entry)) return null;
    const headers = isObject(entry.headers) ? entry.headers : {};
    return { url: entry.url, authorization: headers.Authorization };
  } catch {
    return null;
  }
};

const keyLabel = (keyName: string | null) => (keyName ? ` · key ${keyName}` : " · shared key");

const report = (step: Step, name: string, keyName: string | null, result: Result<boolean>): AgentStatus => {
  if (result.error) {
    step.row(formatRow({ tone: "error", name, message: result.error.message }));
    return "failed";
  }
  step.row(
    formatRow({
      tone: result.data ? "ok" : "skip",
      name,
      message: `${result.data ? NOW_USES : ALREADY_USES}${keyLabel(keyName)}`,
    }),
  );
  return result.data ? "changed" : "unchanged";
};

const connectClaude = async (step: Step, connection: Connection, url: string, deps: AgentKeyDeps) => {
  const name = CLIENT_AGENT_LABELS.claude;
  if (!Bun.which("claude")) {
    step.row(formatRow({ tone: "skip", name, message: "skipped, claude command not found" }));
    return null;
  }
  const current = readClaudeEntry();
  const { apiKey, keyName } = await resolveAgentKey(connection, name, bearerKey(current?.authorization), deps);
  const authorization = `Bearer ${apiKey}`;
  if (current?.url === url && current.authorization === authorization)
    return { id: "claude", keyName, status: report(step, name, keyName, ok(false)) };
  await spawnText(["claude", "mcp", "remove", "--scope", "user", "runelay"]);
  const added = await spawnText([
    "claude",
    "mcp",
    "add",
    "--scope",
    "user",
    "--transport",
    "http",
    "runelay",
    url,
    "--header",
    `Authorization: ${authorization}`,
  ]);
  const result: Result<boolean> = added.exitCode === 0 ? ok(true) : fail("STORAGE_FAILED", added.stderr);
  return { id: "claude", keyName, status: report(step, name, keyName, result) };
};

const connectTomlClient = async (
  step: Step,
  client: keyof typeof TOML_HEADER_KEYS,
  connection: Connection,
  url: string,
  deps: AgentKeyDeps,
) => {
  const file = CLIENT_CONFIG_FILES[client];
  if (!existsSync(dirname(file))) return null;
  const name = CLIENT_AGENT_LABELS[client];
  const current = readOrEmpty(file);
  const { apiKey, keyName } = await resolveAgentKey(connection, name, bearerKey(tomlAuthorization(current)), deps);
  const next = withTomlBlock(current, tomlBlock(client, url, `Bearer ${apiKey}`));
  const written = attemptSync(() => {
    if (next !== current) writeFileSync(file, next);
    return next !== current;
  }, "STORAGE_FAILED");
  return { id: client, keyName, status: report(step, name, keyName, written) };
};

const reportAllowed = (step: Step, name: string, allowed: Result<boolean>) =>
  step.row(
    formatRow(
      allowed.error
        ? { tone: "error", name, message: allowed.error.message }
        : {
            tone: allowed.data ? "ok" : "skip",
            name,
            message: allowed.data ? "runelay memory tools allowed" : "runelay memory tools already allowed",
          },
    ),
  );

const allowCursorCli = (step: Step) => {
  if (!existsSync(CURSOR_CLI_CONFIG) && !Bun.which(CURSOR_CLI_COMMAND)) return;
  reportAllowed(step, "Cursor CLI", allowCursorTools(CURSOR_CLI_CONFIG));
};

const allowClaude = (step: Step) => {
  if (!Bun.which("claude")) return;
  reportAllowed(step, CLIENT_AGENT_LABELS.claude, allowClaudeTools(CLAUDE_SETTINGS_FILE));
};

const registerEverywhere = async (connection: Connection) => {
  const url = `${connection.url}/v1/mcp`;
  const deps = remoteAgentKeyDeps(connection);
  const step = startStep("Registering the runelay MCP in your agents");
  const agents: AgentConnection[] = [];
  const claude = await connectClaude(step, connection, url, deps);
  if (claude) agents.push(claude);
  for (const client of Object.keys(TOML_HEADER_KEYS) as (keyof typeof TOML_HEADER_KEYS)[]) {
    const connected = await connectTomlClient(step, client, connection, url, deps);
    if (connected) agents.push(connected);
  }
  for (const target of installedMcpTargets()) {
    const current = bearerKey(readMcpAuthorization(target));
    const { apiKey, keyName } = await resolveAgentKey(connection, target.name, current, deps);
    const written = registerMcpTarget(target, url, `Bearer ${apiKey}`);
    const result: Result<boolean> = written.error ? written : ok(written.data.length > 0);
    agents.push({ id: target.id, keyName, status: report(step, target.name, keyName, result) });
  }
  allowClaude(step);
  allowCursorCli(step);
  const failed = agents.filter(({ status }) => status === "failed").length;
  const registered = agents.length - failed;
  const changed = agents.filter(({ status }) => status === "changed").length;
  const detail = `${plural(registered, "agent", "agents")} connected · ${changed} changed${failed ? `, ${failed} failed` : ""}`;
  if (!agents.length) step.warn("no supported agent found on this computer");
  else if (failed) step.warn(detail);
  else step.done(detail);
  return { registered, failed, agents };
};

const turnOffNativeMemory = (verbose: boolean) => {
  const step = startStep("Turning off native memory");
  let off = 0;
  let failed = 0;
  for (const { target, result } of disableNativeMemory()) {
    if (result.error) {
      failed += 1;
      step.row(formatRow({ tone: "error", name: target.agent, message: `still on, ${result.error.message}` }));
    } else {
      off += 1;
      if (verbose)
        step.row(
          formatRow(
            result.data.length
              ? { tone: "ok", name: target.agent, message: `native memory off (${result.data.join(", ")})` }
              : { tone: "skip", name: target.agent, message: "native memory was already off" },
          ),
        );
    }
  }
  const manual = installedManualSteps();
  for (const { agent, step: instruction } of manual)
    step.row(formatRow({ tone: "warn", name: agent, message: `do it by hand: ${instruction}` }));
  const detail = `off in ${plural(off, "agent", "agents")}`;
  if (failed || manual.length) step.warn(`${detail}, ${failed + manual.length} need attention`);
  else if (!off) step.skip("no agent with native memory");
  else step.done(detail);
  return { memoryOff: off, manual: manual.length, failed };
};

export interface ConnectOptions {
  briefs?: boolean;
  verbose?: boolean;
}

export const runConnect = async (
  connection: Connection,
  { briefs = true, verbose = true }: ConnectOptions = {},
): Promise<ConnectSummary> => {
  const { registered, failed, agents } = await registerEverywhere(connection);
  const memory = turnOffNativeMemory(verbose);
  const instructions = briefs ? await writeInstructionBriefs(connection) : { current: 0, failed: 0 };
  return {
    registered,
    failed,
    memoryOff: memory.memoryOff,
    manual: memory.manual,
    instructions: instructions.current,
    warnings: failed + memory.failed + memory.manual + instructions.failed,
    agents,
  };
};

export const withKeyNames = (reports: AgentReport[], agents: AgentConnection[] = []): AgentReport[] =>
  reports.map((agent) => ({ ...agent, keyName: agents.find(({ id }) => id === agent.id)?.keyName ?? null }));

export const connectCommand = async (args: string[] = []): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const summary = await runConnect(connection.data);
  if (wantsJson(args)) {
    const agents = withKeyNames(buildAgentReports(), summary.agents);
    const broken = agents.some((agent) => agent.detected && agent.mcpSupported && !agent.mcpRegistered);
    printJson({ command: "connect", ok: !broken, url: connection.data.url, agents });
  }
  printCard({
    title: "Connected",
    stats: [
      ["Agents", `${summary.registered} using runelay${summary.failed ? ` · ${summary.failed} failed` : ""}`],
      ["Native memory", `off in ${plural(summary.memoryOff, "agent", "agents")}`],
      ["Instructions", `${plural(summary.instructions, "agent", "agents")} with the runelay rule`],
      ["Warnings", String(summary.warnings)],
    ],
    next: summary.warnings ? "runelay doctor" : "runelay push",
  });
  return ok(null);
};
