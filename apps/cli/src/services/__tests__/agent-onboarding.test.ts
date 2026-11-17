import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type AgentApiKeyView,
  type ContextBriefView,
  type ContextClient,
  fail,
  ok,
  type Result,
} from "@runelay/shared";

const home = mkdtempSync(join(tmpdir(), "runelay-onboarding-"));
process.env.RUNELAY_HOME = home;

const { readSkills, listLocalSkillSlugs } = await import("../context-reader.service");
const { writeBriefs, withBlock } = await import("../brief-writer.service");
const { briefLeadFor, instructionTargetsFor, RUNELAY_TOOLS, CONTEXT_START_MARKER, CONTEXT_END_MARKER } = await import(
  "../../constants/context.constants"
);
const { agentKeyName, bearerKey, hostLabel, remoteAgentKeyDeps, resolveAgentKey } = await import(
  "../agent-keys.service"
);
const { allowClaudeTools, allowCursorTools, codexToolApprovals, cursorToolPermissions, withCursorPermissions } =
  await import("../tool-approvals.service");
const { tomlAuthorization, tomlBlock, withKeyNames, withTomlBlock } = await import("../../commands/connect.command");
const { mcpTargetsFor } = await import("../../constants/mcp-targets.constants");
const { readMcpAuthorization } = await import("../mcp-registration.service");
const { needsSignIn } = await import("../../commands/setup.command");
const { PROCEED_QUESTION } = await import("../../commands/migrate.command");

const write = (path: string, content: string) => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
};

const caseDir = (name: string) => mkdtempSync(join(home, `${name}-`));

const brief = (markdown: string): Result<ContextBriefView> => ok({ markdown, pinnedCount: 2 } as ContextBriefView);

test("skills inside hidden folders such as .trash are never collected", () => {
  const root = caseDir("skills");
  write(join(root, ".trash", "123", "uuid", "morning", "SKILL.md"), "---\nname: morning\n---\nold");
  write(join(root, ".trash", "SKILL.md"), "---\nname: trash\n---\nold");
  write(join(root, ".git", "SKILL.md"), "x");
  write(join(root, "live", "SKILL.md"), "---\nname: live\n---\nbody");
  write(join(root, "live", ".trash", "notes.md"), "deleted");
  write(join(root, "live", "docs", "guide.md"), "kept");
  const skills = readSkills(root);
  expect(skills.map((skill) => skill.slug)).toEqual(["live"]);
  expect(skills[0]?.files.map((file) => file.path)).toEqual(["docs/guide.md"]);
  expect([...listLocalSkillSlugs([root])]).toEqual(["live"]);
});

test("every brief lead tells the agent to search runelay first and never read local history", () => {
  for (const client of ["claude", "codex", "grok"] as ContextClient[]) {
    const lead = briefLeadFor(client);
    expect(lead).toContain("call the runelay `search_context` tool first");
    expect(lead).toContain("update that slug instead of creating a new one");
    expect(lead).toContain("Never look for memory in local transcripts");
  }
  expect(briefLeadFor("claude")).toContain("ToolSearch select:mcp__runelay__search_context");
  expect(briefLeadFor("codex")).not.toContain("ToolSearch");
});

test("instruction targets follow each agent's documented global file", () => {
  const files = Object.fromEntries(
    instructionTargetsFor("/h", { configHome: "/cfg", kimiHome: "/kimi" }).map((target) => [target.id, target.file]),
  );
  expect(files).toEqual({
    claude: "/h/.claude/CLAUDE.md",
    codex: "/h/.codex/AGENTS.md",
    grok: "/h/.grok/AGENTS.md",
    gemini: "/h/.gemini/GEMINI.md",
    opencode: "/cfg/opencode/AGENTS.md",
    kimi: "/kimi/AGENTS.md",
    hermes: "/h/.hermes/SOUL.md",
    openclaw: "/h/.openclaw/workspace/AGENTS.md",
  });
  expect(instructionTargetsFor("/h").find((target) => target.id === "kimi")?.file).toBe("/h/.kimi-code/AGENTS.md");
});

test("briefs are written between the markers only, once, and only for installed agents", async () => {
  const root = caseDir("briefs");
  const targets = instructionTargetsFor(root);
  mkdirSync(join(root, ".codex"));
  mkdirSync(join(root, ".openclaw"));
  write(join(root, ".kimi-code", "AGENTS.md"), "# Mine\n\nkeep this\n");
  const calls: ContextClient[] = [];
  const fetcher = async (client: ContextClient) => {
    calls.push(client);
    return brief(`brief for ${client}`);
  };
  const first = await writeBriefs(fetcher, targets);
  const status = Object.fromEntries(first.map((outcome) => [outcome.target.id, outcome.status]));
  expect(status).toMatchObject({ codex: "written", kimi: "written", openclaw: "written", claude: "skipped" });
  expect(calls).toEqual(["codex"]);
  const kimi = readFileSync(join(root, ".kimi-code", "AGENTS.md"), "utf8");
  expect(kimi.startsWith("# Mine\n\nkeep this\n\n<!-- runelay:start -->")).toBe(true);
  expect(kimi).toContain("brief for codex");
  expect(existsSync(join(root, ".openclaw", "workspace", "AGENTS.md"))).toBe(true);
  const second = await writeBriefs(fetcher, targets);
  expect(
    second.filter((outcome) => outcome.status !== "skipped").every((outcome) => outcome.status === "unchanged"),
  ).toBe(true);
  expect(readFileSync(join(root, ".kimi-code", "AGENTS.md"), "utf8").match(/runelay:start/g)).toHaveLength(1);
});

test("a brief that fails to load or to write is reported per agent", async () => {
  const root = caseDir("brief-fail");
  const targets = instructionTargetsFor(root);
  mkdirSync(join(root, ".claude"));
  mkdirSync(join(root, ".grok"));
  write(join(root, ".grok", "AGENTS.md", "blocker"), "x");
  const outcomes = await writeBriefs(
    async (client) => (client === "claude" ? fail("UPSTREAM_FAILED", "offline") : brief("ok")),
    targets,
  );
  const byId = Object.fromEntries(outcomes.map((outcome) => [outcome.target.id, outcome]));
  expect(byId.claude).toMatchObject({ status: "failed", message: "offline" });
  expect(byId.grok?.status).toBe("failed");
});

test("withBlock replaces an existing block and appends to empty files", () => {
  expect(withBlock("", "a")).toBe(`${CONTEXT_START_MARKER}\na\n${CONTEXT_END_MARKER}\n`);
  const replaced = withBlock(`top\n${CONTEXT_START_MARKER}\nold\n${CONTEXT_END_MARKER}\nbottom`, "new");
  expect(replaced).toBe(`top\n${CONTEXT_START_MARKER}\nnew\n${CONTEXT_END_MARKER}\nbottom`);
  expect(withBlock("no newline", "b").startsWith("no newline\n\n")).toBe(true);
});

const issued = (key: string, name: string): Result<AgentApiKeyView> => ok({ key, name } as AgentApiKeyView);

test("agent keys are named per agent and host, reused when valid and issued otherwise", async () => {
  const connection = { url: "https://r.test", apiKey: "computer", fromEnv: false };
  expect(hostLabel("MacBook-Pro.local")).toBe("MacBook-Pro");
  expect(hostLabel("")).toBe("computer");
  expect(agentKeyName("Cursor", "MacBook-Pro")).toBe("Cursor · MacBook-Pro");
  expect(agentKeyName("A".repeat(80), "h")).toHaveLength(64);
  expect(bearerKey("Bearer rnl_abc")).toBe("rnl_abc");
  expect(bearerKey("Basic x")).toBeNull();
  expect(bearerKey(undefined)).toBeNull();
  const names: string[] = [];
  const deps = (works: boolean, result = issued("rnl_new", "Cursor · mac")) => ({
    host: "mac",
    works: async (_keyName: string, _apiKey: string) => works,
    issue: async (name: string) => {
      names.push(name);
      return result;
    },
  });
  expect(await resolveAgentKey(connection, "Cursor", "rnl_mine", deps(true))).toEqual({
    apiKey: "rnl_mine",
    keyName: "Cursor · mac",
  });
  expect(names).toEqual([]);
  expect(await resolveAgentKey(connection, "Cursor", "rnl_dead", deps(false))).toEqual({
    apiKey: "rnl_new",
    keyName: "Cursor · mac",
  });
  expect(await resolveAgentKey(connection, "Cursor", "computer", deps(true))).toMatchObject({ apiKey: "rnl_new" });
  expect(await resolveAgentKey(connection, "Cursor", null, deps(true, issued("rnl_x", "")))).toMatchObject({
    keyName: "",
  });
  expect(await resolveAgentKey(connection, "Cursor", null, deps(true, fail("NOT_FOUND", "old server")))).toEqual({
    apiKey: "computer",
    keyName: null,
  });
  expect(names).toEqual(["Cursor · mac", "Cursor · mac", "Cursor · mac", "Cursor · mac"]);
});

test("agent key checks and rotations authenticate with the computer key, never the agent key", async () => {
  const connection = { url: "https://r.test", apiKey: "rnl_computer", fromEnv: false };
  const calls: { path: string; authorization: string | null; body: unknown }[] = [];
  const valid = new Set(["rnl_agent_ok"]);
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const path = new URL(String(input)).pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ path, authorization: new Headers(init?.headers).get("authorization"), body });
    const data =
      path === "/v1/api-keys/agent/check"
        ? { valid: valid.has(body.key) }
        : { key: "rnl_fresh", name: body.name, rotated: 1 };
    return Response.json({ data, error: null });
  }) as typeof fetch;
  try {
    const deps = { ...remoteAgentKeyDeps(connection), host: "mac" };
    expect(await resolveAgentKey(connection, "Cursor", "rnl_agent_ok", deps)).toEqual({
      apiKey: "rnl_agent_ok",
      keyName: "Cursor · mac",
    });
    expect(await resolveAgentKey(connection, "Codex", "rnl_agent_dead", deps)).toEqual({
      apiKey: "rnl_fresh",
      keyName: "Codex · mac",
    });
  } finally {
    globalThis.fetch = original;
  }
  expect(calls.map(({ path }) => path)).toEqual([
    "/v1/api-keys/agent/check",
    "/v1/api-keys/agent/check",
    "/v1/api-keys/agent",
  ]);
  expect(calls.every(({ authorization }) => authorization === "Bearer rnl_computer")).toBe(true);
  expect(calls[0]?.body).toEqual({ name: "Cursor · mac", key: "rnl_agent_ok" });
});

test("codex approvals cover only runelay memory tools, never call_tool or execute", () => {
  const block = codexToolApprovals();
  for (const tool of RUNELAY_TOOLS)
    expect(block).toContain(`[mcp_servers.runelay.tools.${tool}]\napproval_mode = "approve"`);
  expect(block).not.toContain("call_tool");
  expect(block).not.toContain("execute");
  expect(cursorToolPermissions(["read_memory"])).toEqual(["Mcp(runelay:read_memory)"]);
});

test("cursor cli permissions are merged once and keep the user's entries", () => {
  const root = caseDir("cursor");
  const file = join(root, "cli-config.json");
  write(file, JSON.stringify({ version: 1, permissions: { allow: ["Shell(ls)"], deny: ["Shell(rm)"] } }));
  expect(allowCursorTools(file).data).toBe(true);
  const config = JSON.parse(readFileSync(file, "utf8"));
  expect(config.permissions.deny).toEqual(["Shell(rm)"]);
  expect(config.permissions.allow[0]).toBe("Shell(ls)");
  expect(config.permissions.allow).toContain("Mcp(runelay:search_context)");
  expect(config.permissions.allow).not.toContain("Mcp(runelay:call_tool)");
  expect(allowCursorTools(file).data).toBe(false);
  const fresh = join(root, "fresh.json");
  expect(allowCursorTools(fresh).data).toBe(true);
  expect(JSON.parse(readFileSync(fresh, "utf8")).permissions.allow).toHaveLength(RUNELAY_TOOLS.length);
  expect(() => withCursorPermissions('{"permissions": []}', "x")).toThrow("not an object");
  expect(() => withCursorPermissions('{"permissions": {"allow": "all"}}', "x")).toThrow("not a list");
  write(join(root, "broken.json"), "{");
  expect(allowCursorTools(join(root, "broken.json")).error?.code).toBe("STORAGE_FAILED");
});

test("claude settings get runelay memory tools once and keep every other key", () => {
  const root = caseDir("claude");
  const file = join(root, "settings.json");
  write(file, JSON.stringify({ model: "opus", permissions: { allow: ["Bash(ls)"], deny: ["Bash(rm)"] } }));
  expect(allowClaudeTools(file).data).toBe(true);
  const config = JSON.parse(readFileSync(file, "utf8"));
  expect(config.model).toBe("opus");
  expect(config.permissions.deny).toEqual(["Bash(rm)"]);
  expect(config.permissions.allow[0]).toBe("Bash(ls)");
  for (const tool of RUNELAY_TOOLS) expect(config.permissions.allow).toContain(`mcp__runelay__${tool}`);
  expect(config.permissions.allow).not.toContain("mcp__runelay__call_tool");
  expect(config.permissions.allow).not.toContain("mcp__runelay__execute");
  expect(allowClaudeTools(file).data).toBe(false);
  const fresh = join(root, "fresh.json");
  expect(allowClaudeTools(fresh).data).toBe(true);
  expect(JSON.parse(readFileSync(fresh, "utf8")).permissions.allow).toHaveLength(RUNELAY_TOOLS.length);
});

test("the toml block replaces runelay and its tool tables but keeps other tables", () => {
  const current = [
    'model = "gpt"',
    "",
    "[mcp_servers.runelay]",
    'url = "old"',
    'http_headers = { Authorization = "Bearer rnl_old" }',
    "",
    "[mcp_servers.runelay.tools.search_context]",
    'approval_mode = "approve"',
    "",
    "[mcp_servers.github]",
    'url = "gh"',
    "",
  ].join("\n");
  expect(tomlAuthorization(current)).toBe("Bearer rnl_old");
  expect(tomlAuthorization('model = "x"\n')).toBeNull();
  expect(tomlAuthorization('[mcp_servers.runelay]\nurl = "u"\n')).toBeNull();
  const next = withTomlBlock(current, tomlBlock("codex", "https://r.test/v1/mcp", "Bearer rnl_new"));
  expect(next.match(/\[mcp_servers\.runelay\.tools\.search_context\]/g)).toHaveLength(1);
  expect(next).toContain('http_headers = { Authorization = "Bearer rnl_new" }');
  expect(next).toContain("[mcp_servers.github]");
  expect(next).not.toContain("rnl_old");
  expect(withTomlBlock(next, tomlBlock("codex", "https://r.test/v1/mcp", "Bearer rnl_new"))).toBe(next);
  const grok = tomlBlock("grok", "u", "Bearer k");
  expect(grok).toContain('headers = { Authorization = "Bearer k" }');
  expect(grok).not.toContain("approval_mode");
  expect(withTomlBlock("", "[mcp_servers.runelay]\n")).toBe("\n[mcp_servers.runelay]\n");
  expect(withTomlBlock("a = 1", "[mcp_servers.runelay]\n")).toBe("a = 1\n\n[mcp_servers.runelay]\n");
});

test("the authorization already saved in an agent config is read back", () => {
  const root = caseDir("auth");
  const targets = mcpTargetsFor(root);
  const target = (id: string) => targets.find((candidate) => candidate.id === id) ?? targets[0]!;
  expect(readMcpAuthorization(target("cursor"))).toBeNull();
  write(
    join(root, ".cursor", "mcp.json"),
    JSON.stringify({ mcpServers: { runelay: { headers: { Authorization: "Bearer a" } } } }),
  );
  expect(readMcpAuthorization(target("cursor"))).toBe("Bearer a");
  write(join(root, ".gemini", "settings.json"), JSON.stringify({ mcpServers: { runelay: { url: "u" } } }));
  expect(readMcpAuthorization(target("gemini"))).toBeNull();
  write(join(root, ".openclaw", "openclaw.json"), "{");
  expect(readMcpAuthorization(target("openclaw"))).toBeNull();
  write(
    join(root, ".hermes", "config.yaml"),
    'mcp_servers:\n  runelay:\n    url: "u"\n    headers:\n      Authorization: "Bearer y"\n',
  );
  expect(readMcpAuthorization(target("hermes"))).toBe("Bearer y");
  write(join(root, ".hermes", "config.yaml"), "mcp_servers:\n  other:\n    url: u\n");
  expect(readMcpAuthorization(target("hermes"))).toBeNull();
});

test("json agent rows carry the key name connect used", () => {
  const rows = withKeyNames(
    [
      { id: "cursor", keyName: null },
      { id: "codex", keyName: null },
    ] as never,
    [{ id: "cursor", status: "changed", keyName: "Cursor · mac" }],
  );
  expect(rows.map((row) => row.keyName)).toEqual(["Cursor · mac", null]);
  expect(withKeyNames([{ id: "x", keyName: null }] as never)[0]?.keyName).toBeNull();
});

test("setup signs in only when not connected or pointed at another server", () => {
  const connected = ok({ url: "https://r.test", apiKey: "k", fromEnv: false });
  expect(needsSignIn(connected, undefined)).toBe(false);
  expect(needsSignIn(connected, "https://r.test/")).toBe(false);
  expect(needsSignIn(connected, "https://other.test")).toBe(true);
  expect(needsSignIn(fail("UNAUTHORIZED", "no"), undefined)).toBe(true);
  expect(PROCEED_QUESTION).toBe("Send everything to your runelay account?");
});
