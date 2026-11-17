import { expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "runelay-archive-"));
process.env.RUNELAY_HOME = home;

const { archiveImportedMemories } = await import("../memory-archive.service");
const { readMemories } = await import("../context-reader.service");

const writeMemory = (directory: string, name: string, body: string) => {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${name}.md`), `---\nname: ${name}\n---\n${body}\n`);
};

test("moves only fully imported flat memory dirs into a timestamped archive", () => {
  const imported = join(home, ".claude", "projects", "-Users-me-app", "memory");
  const different = join(home, ".claude", "projects", "-Users-me-other", "memory");
  const codex = join(home, ".codex", "memories");
  const nested = join(home, ".codex", "nested-memories");
  const empty = join(home, ".codex", "empty");
  writeMemory(imported, "rule-a", "body a");
  writeFileSync(join(imported, "MEMORY.md"), "- [rule-a](rule-a.md)\n");
  writeMemory(different, "rule-a", "another body");
  writeMemory(codex, "codex-rule", "codex body");
  writeMemory(nested, "nested-rule", "nested body");
  mkdirSync(join(nested, "rollout_summaries"));
  mkdirSync(empty, { recursive: true });

  const result = archiveImportedMemories({
    sent: [...readMemories(imported), ...readMemories(codex), ...readMemories(nested)],
    directories: [imported, different, codex, nested, empty, join(home, "missing")],
    home,
    archiveRoot: join(home, ".runelay", "archive"),
    now: new Date("2026-11-16T10:00:00.000Z"),
  });

  const archiveDir = join(home, ".runelay", "archive", "2026-11-16T10-00-00-000Z");
  expect(result.data).toEqual({ archiveDir, moved: [imported, codex], kept: [different, nested] });
  expect(existsSync(imported)).toBe(false);
  const archivedIndex = join(archiveDir, ".claude", "projects", "-Users-me-app", "memory", "MEMORY.md");
  expect(readFileSync(archivedIndex, "utf8")).toContain("rule-a");
  expect(existsSync(join(archiveDir, ".codex", "memories", "codex-rule.md"))).toBe(true);
  expect(existsSync(join(different, "rule-a.md"))).toBe(true);
  expect(existsSync(empty)).toBe(true);
});

test("archives nothing when nothing was sent", () => {
  const directory = join(home, "empty-projects", "p", "memory");
  writeMemory(directory, "only", "body");
  const result = archiveImportedMemories({
    sent: [],
    directories: [directory],
    home,
    archiveRoot: join(home, ".runelay", "archive"),
    now: new Date(),
  });
  expect(result.data).toEqual({ archiveDir: null, moved: [], kept: [directory] });
});
