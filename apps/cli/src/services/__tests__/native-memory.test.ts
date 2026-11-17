import { beforeEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-native-memory-"));
process.env.RUNELAY_HOME = home;

const { manualMemoryStepsFor, nativeMemoryTargetsFor } = await import("../../constants/agent-memory.constants");
const { disableNativeMemory, inspectNativeMemory, installedManualSteps } = await import("../native-memory.service");

let root = "";
let targets = nativeMemoryTargetsFor(home);

const outcomeOf = (agent: string, outcomes = disableNativeMemory(targets)) =>
  outcomes.find((outcome) => outcome.target.agent === agent)?.result;

beforeEach(() => {
  root = mkdtempSync(join(home, "case-"));
  targets = nativeMemoryTargetsFor(root);
});

test("skips agents that are not installed", () => {
  expect(disableNativeMemory(targets)).toHaveLength(0);
  expect(installedManualSteps(manualMemoryStepsFor(root))).toHaveLength(0);
});

test("claude: creates settings.json, keeps other keys and is idempotent", () => {
  mkdirSync(join(root, ".claude"));
  expect(outcomeOf("Claude Code")?.data).toEqual(["autoMemoryEnabled"]);
  const file = join(root, ".claude", "settings.json");
  writeFileSync(file, JSON.stringify({ model: "opus", autoMemoryEnabled: true }));
  disableNativeMemory(targets);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ model: "opus", autoMemoryEnabled: false });
  expect(outcomeOf("Claude Code")?.data).toEqual([]);
  expect(outcomeOf("Claude Code", inspectNativeMemory(targets))?.data).toEqual([]);
});

test("claude: leaves invalid JSON untouched", () => {
  mkdirSync(join(root, ".claude"));
  const file = join(root, ".claude", "settings.json");
  writeFileSync(file, "{ broken");
  expect(outcomeOf("Claude Code")?.error).not.toBeNull();
  expect(readFileSync(file, "utf8")).toBe("{ broken");
});

test("grok: turns off memory and memory_v2 and keeps the runelay server", () => {
  mkdirSync(join(root, ".grok"));
  const file = join(root, ".grok", "config.toml");
  writeFileSync(file, '[mcp_servers.runelay]\nurl = "https://x/v1/mcp"\n\n[memory_v2]\nenabled = true\n');
  expect(outcomeOf("Grok", inspectNativeMemory(targets))?.data).toEqual(["memory.enabled", "memory_v2.enabled"]);
  expect(outcomeOf("Grok")?.data).toEqual(["memory.enabled", "memory_v2.enabled"]);
  const content = readFileSync(file, "utf8");
  expect(content).toContain('[mcp_servers.runelay]\nurl = "https://x/v1/mcp"');
  expect(content).toContain("[memory_v2]\nenabled = false");
  expect(content).toContain("[memory]\nenabled = false");
  expect(outcomeOf("Grok")?.data).toEqual([]);
  expect(existsSync(join(root, ".claude", "settings.json"))).toBe(false);
});

test("codex: turns off the memories feature and both memories switches", () => {
  mkdirSync(join(root, ".codex"));
  const file = join(root, ".codex", "config.toml");
  writeFileSync(file, "[features]\nweb_search = true\n\n[memories]\nuse_memories = true\n");
  expect(outcomeOf("Codex")?.data).toEqual([
    "features.memories",
    "memories.generate_memories",
    "memories.use_memories",
  ]);
  const content = readFileSync(file, "utf8");
  expect(content).toContain("[features]\nmemories = false\nweb_search = true");
  expect(content).toContain("generate_memories = false");
  expect(content).toContain("use_memories = false");
  expect(outcomeOf("Codex")?.data).toEqual([]);
});

test("gemini: merges save_memory into tools.exclude without dropping entries", () => {
  mkdirSync(join(root, ".gemini"));
  const file = join(root, ".gemini", "settings.json");
  writeFileSync(file, JSON.stringify({ tools: { exclude: ["run_shell_command"] }, theme: "dark" }));
  expect(outcomeOf("Gemini")?.data).toEqual(["experimental.autoMemory", "tools.exclude += save_memory"]);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
    tools: { exclude: ["run_shell_command", "save_memory"] },
    theme: "dark",
    experimental: { autoMemory: false },
  });
  expect(outcomeOf("Gemini")?.data).toEqual([]);
});

test("gemini: reports a tools.exclude that is not a list", () => {
  mkdirSync(join(root, ".gemini"));
  writeFileSync(join(root, ".gemini", "settings.json"), JSON.stringify({ tools: { exclude: "x" } }));
  expect(outcomeOf("Gemini")?.error?.message).toContain("tools.exclude");
});

test("hermes: turns off memory and user profile in config.yaml", () => {
  mkdirSync(join(root, ".hermes"));
  const file = join(root, ".hermes", "config.yaml");
  writeFileSync(file, "model: x\nmemory:\n  memory_enabled: true\n  user_profile_enabled: true\n");
  expect(outcomeOf("Hermes Agent")?.data).toEqual(["memory.memory_enabled", "memory.user_profile_enabled"]);
  const expected = "model: x\nmemory:\n  memory_enabled: false\n  user_profile_enabled: false\n";
  expect(readFileSync(file, "utf8")).toBe(expected);
  expect(outcomeOf("Hermes Agent")?.data).toEqual([]);
});

test("openclaw: sets the memory slot to none", () => {
  mkdirSync(join(root, ".openclaw"));
  const file = join(root, ".openclaw", "openclaw.json");
  writeFileSync(file, JSON.stringify({ plugins: { allow: ["x"] } }));
  expect(outcomeOf("OpenClaw")?.data).toEqual(["plugins.slots.memory"]);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ plugins: { allow: ["x"], slots: { memory: "none" } } });
});

test("mausbot: turns off auto recall and keeps other features", () => {
  mkdirSync(join(root, ".openmausbot"));
  const file = join(root, ".openmausbot", "config.json");
  writeFileSync(file, JSON.stringify({ features: { browser: true }, mcpServers: {} }));
  expect(outcomeOf("MausBot")?.data).toEqual(["features.autoRecall"]);
  expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({
    features: { browser: true, autoRecall: false },
    mcpServers: {},
  });
  expect(outcomeOf("MausBot")?.data).toEqual([]);
});

test("antigravity: only a manual step", () => {
  mkdirSync(join(root, ".gemini", "antigravity"), { recursive: true });
  expect(installedManualSteps(manualMemoryStepsFor(root)).map((step) => step.agent)).toEqual(["Antigravity"]);
  expect(outcomeOf("Gemini")).toBeUndefined();
});
