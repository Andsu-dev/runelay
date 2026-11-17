import { beforeEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-mcp-"));
process.env.RUNELAY_HOME = home;

const { mcpTargetsFor } = await import("../../constants/mcp-targets.constants");
const { installedMcpTargets, readMcpRegistration, registerMcpTarget } = await import("../mcp-registration.service");
const { buildAgentReports } = await import("../agent-report.service");

const URL = "https://runelay.test/v1/mcp";
const AUTH = "Bearer rnl_test";
const noBinary = () => null;

let root = "";
let targets = mcpTargetsFor(home);

const targetOf = (id: string) => {
  const target = targets.find((candidate) => candidate.id === id);
  if (!target) throw new Error(id);
  return target;
};

const write = (path: string, content: string) => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
};

const read = (path: string) => readFileSync(path, "utf8");

beforeEach(() => {
  root = mkdtempSync(join(home, "case-"));
  targets = mcpTargetsFor(root);
});

const jsonCases = [
  {
    id: "cursor",
    setup: () => mkdirSync(join(root, ".cursor")),
    file: () => join(root, ".cursor", "mcp.json"),
    path: ["mcpServers"],
    entry: { url: URL, headers: { Authorization: AUTH } },
  },
  {
    id: "gemini",
    setup: () => write(join(root, ".gemini", "settings.json"), ""),
    file: () => join(root, ".gemini", "settings.json"),
    path: ["mcpServers"],
    entry: { url: URL, type: "http", headers: { Authorization: AUTH } },
  },
  {
    id: "antigravity",
    setup: () => mkdirSync(join(root, ".gemini", "antigravity"), { recursive: true }),
    file: () => join(root, ".gemini", "config", "mcp_config.json"),
    path: ["mcpServers"],
    entry: { serverUrl: URL, headers: { Authorization: AUTH } },
  },
  {
    id: "opencode",
    setup: () => mkdirSync(join(root, ".config", "opencode"), { recursive: true }),
    file: () => join(root, ".config", "opencode", "opencode.json"),
    path: ["mcp"],
    entry: { type: "remote", url: URL, enabled: true, oauth: false, headers: { Authorization: AUTH } },
  },
  {
    id: "kimi",
    setup: () => mkdirSync(join(root, ".kimi-code")),
    file: () => join(root, ".kimi-code", "mcp.json"),
    path: ["mcpServers"],
    entry: { transport: "http", url: URL, headers: { Authorization: AUTH } },
  },
  {
    id: "openclaw",
    setup: () => mkdirSync(join(root, ".openclaw")),
    file: () => join(root, ".openclaw", "openclaw.json"),
    path: ["mcp", "servers"],
    entry: { url: URL, transport: "streamable-http", headers: { Authorization: AUTH } },
  },
  {
    id: "mausbot",
    setup: () => mkdirSync(join(root, ".openmausbot")),
    file: () => join(root, ".openmausbot", "config.json"),
    path: ["mcpServers"],
    entry: { type: "http", url: URL, headers: { Authorization: AUTH } },
  },
];

const nest = (path: string[], value: unknown): Record<string, unknown> =>
  path.reduceRight<Record<string, unknown>>((inner, key) => ({ [key]: inner }), value as Record<string, unknown>);

test("skips every agent that is not installed", () => {
  expect(installedMcpTargets(targets, noBinary)).toHaveLength(0);
  expect(existsSync(join(root, ".gemini"))).toBe(false);
});

test("detects gemini and kimi by their command", () => {
  const ids = installedMcpTargets(targets, (command) => `/bin/${command}`).map(({ id }) => id);
  expect(ids).toEqual(["gemini", "kimi"]);
});

for (const { id, setup, file, path, entry } of jsonCases) {
  test(`${id}: creates the file with the official entry and is idempotent`, () => {
    setup();
    const target = targetOf(id);
    expect(installedMcpTargets(targets, noBinary).map((candidate) => candidate.id)).toContain(id);
    expect(registerMcpTarget(target, URL, AUTH).data).toEqual([file()]);
    const first = read(file());
    expect(JSON.parse(first)).toEqual(nest(path, { runelay: entry }));
    expect(registerMcpTarget(target, URL, AUTH).data).toEqual([]);
    expect(read(file())).toBe(first);
    expect(readMcpRegistration(target)).toEqual({ registered: true, message: null });
  });

  test(`${id}: keeps other keys, servers and order`, () => {
    setup();
    const other = { command: "npx", args: ["x"] };
    const original = `${JSON.stringify({ theme: "dark", ...nest(path, { other, runelay: { url: "old" } }), last: 1 }, null, 2)}\n`;
    write(file(), original);
    expect(readMcpRegistration(targetOf(id)).registered).toBe(true);
    registerMcpTarget(targetOf(id), URL, AUTH);
    const next = read(file());
    expect(next).toBe(
      `${JSON.stringify({ theme: "dark", ...nest(path, { other, runelay: entry }), last: 1 }, null, 2)}\n`,
    );
    registerMcpTarget(targetOf(id), URL, AUTH);
    expect(read(file())).toBe(next);
  });

  test(`${id}: leaves an unparsable file untouched`, () => {
    setup();
    write(file(), "{ broken, // comment\n");
    const result = registerMcpTarget(targetOf(id), URL, AUTH);
    expect(result.error?.message).toContain("add runelay by hand");
    expect(read(file())).toBe("{ broken, // comment\n");
    expect(readMcpRegistration(targetOf(id)).message).toContain(file());
  });
}

test("cursor: keeps a file without a trailing newline as it was", () => {
  const file = join(root, ".cursor", "mcp.json");
  write(file, JSON.stringify({ mcpServers: {} }, null, 2));
  registerMcpTarget(targetOf("cursor"), URL, AUTH);
  expect(read(file).endsWith("}")).toBe(true);
});

test("gemini: replaces a legacy httpUrl entry entirely", () => {
  const file = join(root, ".gemini", "settings.json");
  write(file, JSON.stringify({ mcpServers: { runelay: { httpUrl: "old", timeout: 5 } } }));
  registerMcpTarget(targetOf("gemini"), URL, AUTH);
  expect(JSON.parse(read(file)).mcpServers.runelay).toEqual({
    url: URL,
    type: "http",
    headers: { Authorization: AUTH },
  });
});

test("antigravity: updates the legacy file only when it exists", () => {
  const legacy = join(root, ".gemini", "antigravity", "mcp_config.json");
  const current = join(root, ".gemini", "config", "mcp_config.json");
  write(legacy, JSON.stringify({ mcpServers: { other: { serverUrl: "x" } } }, null, 2));
  expect(registerMcpTarget(targetOf("antigravity"), URL, AUTH).data).toEqual([current, legacy]);
  expect(Object.keys(JSON.parse(read(legacy)).mcpServers)).toEqual(["other", "runelay"]);
  expect(JSON.parse(read(current)).mcpServers.runelay.serverUrl).toBe(URL);
});

test("opencode: writes a strict-JSON opencode.jsonc and refuses one with comments", () => {
  const jsonc = join(root, ".config", "opencode", "opencode.jsonc");
  write(jsonc, '{\n  "model": "x"\n}\n');
  expect(registerMcpTarget(targetOf("opencode"), URL, AUTH).data).toEqual([jsonc]);
  expect(existsSync(join(root, ".config", "opencode", "opencode.json"))).toBe(false);
  expect(JSON.parse(read(jsonc)).mcp.runelay.type).toBe("remote");

  const commented = '{\n  // mine\n  "model": "x"\n}\n';
  write(jsonc, commented);
  expect(registerMcpTarget(targetOf("opencode"), URL, AUTH).error).not.toBeNull();
  expect(read(jsonc)).toBe(commented);
});

test("opencode: counts a runelay server declared in config.json", () => {
  write(join(root, ".config", "opencode", "config.json"), JSON.stringify({ mcp: { runelay: { type: "remote" } } }));
  expect(readMcpRegistration(targetOf("opencode")).registered).toBe(true);
});

test("opencode and kimi: honor XDG_CONFIG_HOME and KIMI_CODE_HOME", () => {
  const custom = mcpTargetsFor(root, { configHome: join(root, "xdg"), kimiHome: join(root, "kimi") });
  expect(custom.find(({ id }) => id === "opencode")?.files[0]).toBe(join(root, "xdg", "opencode", "opencode.json"));
  expect(custom.find(({ id }) => id === "kimi")?.files[0]).toBe(join(root, "kimi", "mcp.json"));
});

test("hermes: writes the mcp_servers block, keeps the rest and is idempotent", () => {
  const file = join(root, ".hermes", "config.yaml");
  const original = [
    "model: x",
    "mcp_servers:",
    "  github:",
    "    command: npx  # keep",
    "  runelay:",
    "    url: old",
    "memory:",
    "  memory_enabled: false",
    "",
  ].join("\n");
  write(file, original);
  expect(registerMcpTarget(targetOf("hermes"), URL, AUTH).data).toEqual([file]);
  const next = read(file);
  expect(next).toBe(
    [
      "model: x",
      "mcp_servers:",
      "  github:",
      "    command: npx  # keep",
      "  runelay:",
      `    url: "${URL}"`,
      "    headers:",
      `      Authorization: "${AUTH}"`,
      "memory:",
      "  memory_enabled: false",
      "",
    ].join("\n"),
  );
  expect(registerMcpTarget(targetOf("hermes"), URL, AUTH).data).toEqual([]);
  expect(read(file)).toBe(next);
  expect(readMcpRegistration(targetOf("hermes")).registered).toBe(true);
});

test("hermes: creates config.yaml and leaves a flow-style mcp_servers untouched", () => {
  mkdirSync(join(root, ".hermes"));
  const file = join(root, ".hermes", "config.yaml");
  registerMcpTarget(targetOf("hermes"), URL, AUTH);
  expect(read(file)).toBe(
    `mcp_servers:\n  runelay:\n    url: "${URL}"\n    headers:\n      Authorization: "${AUTH}"\n`,
  );

  write(file, "mcp_servers: {}\n");
  expect(registerMcpTarget(targetOf("hermes"), URL, AUTH).error).not.toBeNull();
  expect(read(file)).toBe("mcp_servers: {}\n");
});

test("report marks the new agents as supported and reads their entry", () => {
  write(join(root, ".gemini", "settings.json"), JSON.stringify({ mcpServers: { runelay: { url: URL } } }));
  write(join(root, ".openclaw", "openclaw.json"), JSON.stringify({ mcp: { servers: {} } }));
  write(join(root, ".hermes", "config.yaml"), "mcp_servers:\n  runelay:\n    url: u\n");
  mkdirSync(join(root, ".kimi-code"));
  write(join(root, ".openmausbot", "config.json"), JSON.stringify({ mcpServers: { runelay: { type: "http", url: URL } } }));
  const byId = Object.fromEntries(buildAgentReports({ home: root, which: noBinary }).map((agent) => [agent.id, agent]));
  expect(byId.gemini).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: true });
  expect(byId.openclaw).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: false });
  expect(byId.hermes).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: true });
  expect(byId.kimi).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: false });
  expect(byId.mausbot).toMatchObject({ detected: true, mcpSupported: true, mcpRegistered: true });
  expect(byId.opencode).toMatchObject({ detected: false, mcpSupported: true, mcpRegistered: false });
});
