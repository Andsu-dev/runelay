import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-doctor-"));
process.env.RUNELAY_HOME = home;

const { manualMemoryStepsFor, nativeMemoryTargetsFor } = await import("../../constants/agent-memory.constants");
const { mcpTargetsFor } = await import("../../constants/mcp-targets.constants");
const { findInstructionConflicts, runDoctor } = await import("../doctor.service");
const { readLastPush, recordLastPush } = await import("../push-state.service");

const write = (path: string, content: string) => {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
};

test("flags local memory rules outside the runelay block only", () => {
  const path = join(home, "conflicts", "AGENTS.md");
  write(
    path,
    [
      "# Regras",
      "- Grave memória em ~/.claude/projects/x/memory/ ao fim da tarefa.",
      "- Nunca gravar memória em `memory/` nem no vault.",
      "Proibido escrever em `~/.claude/projects/*/memory/`,",
      "`MEMORY.md` ou no vault.",
      "",
      "Update the MEMORY.md index after each task.",
      "<!-- runelay:start -->",
      "Old notes lived in memory/ folders.",
      "<!-- runelay:end -->",
      "Save memory to ./notes/memory.md",
    ].join("\n"),
  );
  const conflicts = findInstructionConflicts([{ agent: "Agents (home)", path, slug: "x" }]);
  expect(conflicts.map((conflict) => conflict.line)).toEqual([2, 7, 11]);
});

test("push state round-trips the last push time", () => {
  const file = join(home, "state", "state.json");
  expect(readLastPush(file)).toBeNull();
  expect(recordLastPush(1234, file).error).toBeNull();
  expect(readLastPush(file)).toBe(1234);
});

test("warns on every broken piece and passes once it is fixed", () => {
  const root = mkdtempSync(join(home, "case-"));
  const claudeJson = join(root, ".claude.json");
  const grokToml = join(root, ".grok", "config.toml");
  const settings = join(root, ".claude", "settings.json");
  const memoryDir = join(root, ".claude", "projects", "-p", "memory");
  const skill = join(root, ".claude", "skills", "my-skill");
  const codexMemories = join(root, "codex-memories");
  write(claudeJson, JSON.stringify({ mcpServers: {} }));
  write(grokToml, "[memory]\nenabled = false\n");
  write(settings, "{}");
  write(join(memoryDir, "rule.md"), "body");
  write(join(codexMemories, "codex.md"), "body");
  mkdirSync(join(root, ".gemini", "antigravity"), { recursive: true });
  write(join(skill, "SKILL.md"), "---\nname: my-skill\n---\nbody");
  const input = {
    nativeMemory: nativeMemoryTargetsFor(root),
    manualMemory: manualMemoryStepsFor(root),
    clientConfigs: { claude: claudeJson, grok: grokToml, codex: join(root, ".codex", "config.toml") },
    mcpTargets: mcpTargetsFor(root),
    instructionFiles: [],
    projectsDir: join(root, ".claude", "projects"),
    extraMemoryDirs: [codexMemories],
    skillDirs: [join(root, ".claude", "skills")],
    lastPushAt: null,
  };

  const broken = runDoctor(input);
  expect(broken.find((check) => check.fix === "runelay migrate")?.details).toEqual([memoryDir, codexMemories]);
  expect(broken.filter((check) => check.status === "info").map((check) => check.label)).toEqual([
    "Antigravity: native memory can only be turned off by hand",
  ]);
  expect(broken.filter((check) => check.status === "warn").map((check) => check.fix)).toEqual([
    "runelay connect",
    "runelay connect",
    "runelay connect",
    "runelay connect",
    "runelay connect",
    "runelay migrate",
    "runelay push",
  ]);

  write(claudeJson, JSON.stringify({ mcpServers: { runelay: { type: "http" } } }));
  write(grokToml, '[memory]\nenabled = false\n[memory_v2]\nenabled = false\n[mcp_servers.runelay]\nurl = "u"\n');
  write(settings, JSON.stringify({ autoMemoryEnabled: false }));
  write(join(root, ".gemini", "config", "mcp_config.json"), JSON.stringify({ mcpServers: { runelay: {} } }));
  const past = new Date("2026-01-01T00:00:00Z");
  utimesSync(join(skill, "SKILL.md"), past, past);
  utimesSync(skill, past, past);
  const clean = { ...input, projectsDir: join(root, "none"), extraMemoryDirs: [] };
  const fixed = runDoctor({ ...clean, lastPushAt: Date.now() });
  expect(fixed.every((check) => check.status !== "warn")).toBe(true);

  const stale = runDoctor({ ...clean, lastPushAt: past.getTime() - 1000 });
  expect(stale.find((check) => check.status === "warn")?.fix).toBe("runelay push");
});
