import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.RUNELAY_HOME = mkdtempSync(join(tmpdir(), "runelay-help-"));

const { COMMAND_ALIASES, COMMAND_GROUPS, COMMAND_GUIDE } = await import("../../constants/cli.constants");
const { COMMANDS, PRIMARY_COMMANDS } = await import("../../constants/commands.constants");
const { renderHelp } = await import("../help");
const { buildMenuItems } = await import("../../commands/home.command");

test("grouped help lists every registered command with its description", () => {
  const help = renderHelp();
  for (const name of Object.keys(PRIMARY_COMMANDS)) {
    const guide = COMMAND_GUIDE[name as keyof typeof COMMAND_GUIDE];
    expect(help).toContain(guide.usage);
    expect(help).toContain(guide.summary);
  }
  const rows = help.split("\n").filter((line) => /^ {2}\S \S/.test(line));
  const summaries = Object.values(COMMAND_GUIDE).map((guide) => guide.summary);
  const starts = rows.flatMap((line) =>
    summaries.filter((summary) => line.endsWith(summary)).map(() => line.lastIndexOf("  ") + 2),
  );
  expect(new Set(starts).size).toBe(1);
  expect(new Set(rows.map((line) => line.length - line.trimStart().length)).size).toBe(1);
  expect(rows.length).toBeGreaterThan(10);
  for (const flag of ["--json", "--no-motion", "--verbose", "--version", "--help"]) expect(help).toContain(flag);
});

test("every command sits in exactly one group and aliases point to real commands", () => {
  const grouped: string[] = COMMAND_GROUPS.flatMap((group) => group.commands);
  expect(new Set(grouped).size).toBe(grouped.length);
  expect([...grouped].sort()).toEqual(Object.keys(COMMAND_GUIDE).sort());
  const registered = Object.keys(COMMANDS).filter((name) => !(name in COMMAND_ALIASES));
  expect(registered.sort()).toEqual(Object.keys(PRIMARY_COMMANDS).sort());
});

test("menu puts set up first and recommends it when not connected", () => {
  const items = buildMenuItems({
    connected: false,
    url: null,
    organization: null,
    agents: 0,
    agentsMissing: 0,
    warnings: 0,
    lastPush: null,
  });
  expect(items[0]?.id).toBe("setup");
  expect(items[0]?.badge).toContain("recommended");
  expect(items.map((item) => item.id).slice(0, -1)).toEqual(COMMAND_GROUPS.flatMap((group) => group.commands));
  expect(items.at(-1)?.id).toBe("quit");
  const connected = buildMenuItems({
    connected: true,
    url: "http://x",
    organization: "Acme",
    agents: 3,
    agentsMissing: 0,
    warnings: 2,
    lastPush: Date.now(),
  });
  expect(connected.find((item) => item.id === "doctor")?.badge).toContain("2 warnings");
  expect(connected.find((item) => item.id === "login")?.badge).toContain("signed in");
});
