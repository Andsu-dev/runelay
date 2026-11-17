import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-json-"));
process.env.RUNELAY_HOME = home;

const { buildAgentReports, toCheckReport } = await import("../agent-report.service");
const { runDoctor } = await import("../doctor.service");
const { manualMemoryStepsFor, nativeMemoryTargetsFor } = await import("../../constants/agent-memory.constants");
const { mcpTargetsFor } = await import("../../constants/mcp-targets.constants");

const write = (path: string, content: string) => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
};

const AGENT_KEYS = ["detected", "id", "keyName", "mcpRegistered", "mcpSupported", "message", "name", "nativeMemory"];
const CHECK_KEYS = ["details", "fix", "kind", "label", "paths", "status"];

const cliEntry = join(import.meta.dir, "..", "..", "index.ts");

const runCli = (args: string[], root: string) => {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? "",
    HOME: root,
    RUNELAY_HOME: root,
    XDG_CONFIG_HOME: join(root, ".config"),
    RUNELAY_SKIP_KEYCHAIN: "1",
    NO_COLOR: "1",
  };
  const result = Bun.spawnSync(["bun", cliEntry, ...args], { env, stdout: "pipe", stderr: "pipe" });
  const lines = result.stdout.toString().trim().split("\n").filter(Boolean);
  return { exitCode: result.exitCode, lines, parsed: JSON.parse(lines.at(-1) ?? "null") };
};

test("reports every known agent with a stable shape", () => {
  const root = mkdtempSync(join(home, "agents-"));
  write(join(root, ".claude.json"), JSON.stringify({ mcpServers: { runelay: { type: "http" } } }));
  write(join(root, ".claude", "settings.json"), JSON.stringify({ autoMemoryEnabled: false }));
  write(join(root, ".codex", "config.toml"), "[features]\nmemories = true\n");
  mkdirSync(join(root, ".gemini", "antigravity"), { recursive: true });

  const agents = buildAgentReports({ home: root, which: () => null });
  for (const agent of agents) expect(Object.keys(agent).sort()).toEqual(AGENT_KEYS);

  const byId = Object.fromEntries(agents.map((agent) => [agent.id, agent]));
  expect(byId.claude).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: true, nativeMemory: "off" });
  expect(byId.codex).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: false, nativeMemory: "on" });
  expect(byId.antigravity).toMatchObject({
    detected: true,
    mcpSupported: true,
    mcpRegistered: false,
    nativeMemory: "manual",
  });
  expect(byId.cursor).toMatchObject({ detected: false, mcpRegistered: false, nativeMemory: "n/a", message: null });
});

test("flags a detected agent whose command is missing", () => {
  const root = mkdtempSync(join(home, "missing-"));
  mkdirSync(join(root, ".claude"), { recursive: true });
  const [claude] = buildAgentReports({ home: root, which: () => null });
  expect(claude).toMatchObject({ id: "claude", detected: true, mcpRegistered: false });
  expect(claude?.message).toContain("claude");

  const [found] = buildAgentReports({ home: root, which: (command) => `/bin/${command}` });
  expect(found?.message).toBeNull();
});

test("doctor checks carry a kind and the files to open", () => {
  const root = mkdtempSync(join(home, "doctor-"));
  const agents = join(root, "AGENTS.md");
  write(agents, "- Grave memória em ~/.claude/projects/x/memory/ ao fim da tarefa.\n");
  const checks = runDoctor({
    nativeMemory: nativeMemoryTargetsFor(root),
    manualMemory: manualMemoryStepsFor(root),
    clientConfigs: {},
    mcpTargets: mcpTargetsFor(root),
    instructionFiles: [{ agent: "Agents (home)", path: agents, slug: "agents" }],
    projectsDir: join(root, "none"),
    extraMemoryDirs: [],
    skillDirs: [],
    lastPushAt: null,
  }).map(toCheckReport);

  for (const check of checks) expect(Object.keys(check).sort()).toEqual(CHECK_KEYS);
  const instructions = checks.find((check) => check.kind === "instructions");
  expect(instructions).toMatchObject({ status: "warn", paths: [agents] });
  expect(checks.find((check) => check.kind === "skills")).toMatchObject({ status: "ok", fix: null, paths: [] });
});

test("doctor --json prints one JSON object on stdout", () => {
  const root = mkdtempSync(join(home, "cli-doctor-"));
  write(join(root, ".claude", "settings.json"), "{}");
  const { lines, parsed } = runCli(["doctor", "--json"], root);
  expect(lines).toHaveLength(1);
  expect(parsed).toMatchObject({ command: "doctor", ok: false });
  expect(parsed.warnings).toBeGreaterThan(0);
  expect(parsed.agents.find((agent: { id: string }) => agent.id === "claude")).toMatchObject({
    detected: true,
    nativeMemory: "on",
  });
  expect(parsed.checks.every((check: { kind: string }) => typeof check.kind === "string")).toBe(true);
});

test("connect and migrate --json without a login print a JSON failure", () => {
  const root = mkdtempSync(join(home, "cli-anon-"));
  for (const command of ["connect", "migrate"]) {
    const { exitCode, lines, parsed } = runCli([command, "--json"], root);
    expect(exitCode).toBe(1);
    expect(lines).toHaveLength(1);
    expect(parsed).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  }
});
