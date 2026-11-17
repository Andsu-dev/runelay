import { expect, test } from "bun:test";
import { readYamlBlock, readYamlValue, setYamlBlock, setYamlValue } from "../yaml";

test("appends the section when it is missing", () => {
  expect(setYamlValue("model: x\n", "memory", "memory_enabled", "false")).toBe(
    "model: x\nmemory:\n  memory_enabled: false\n",
  );
  expect(setYamlValue("", "memory", "memory_enabled", "false")).toBe("memory:\n  memory_enabled: false\n");
});

test("replaces a child key and keeps the indent and the other keys", () => {
  const tail = "    char_limit: 2200\nmcp_servers:\n  runelay:\n    url: u\n";
  const current = `memory:\n    memory_enabled: true  # on\n${tail}`;
  const next = setYamlValue(current, "memory", "memory_enabled", "false");
  expect(next).toBe(`memory:\n    memory_enabled: false\n${tail}`);
  expect(readYamlValue(next, "memory", "memory_enabled")).toBe("false");
  expect(readYamlValue(current, "memory", "memory_enabled")).toBe("true");
});

test("adds a missing child key with the section indent", () => {
  const next = setYamlValue("memory:\n    char_limit: 1\n", "memory", "user_profile_enabled", "false");
  expect(next).toBe("memory:\n    user_profile_enabled: false\n    char_limit: 1\n");
});

test("does not read a nested key with the same name", () => {
  expect(readYamlValue("memory:\n  nested:\n    memory_enabled: false\n", "memory", "memory_enabled")).toBeUndefined();
});

test("refuses a flow-style section", () => {
  expect(() => setYamlValue("memory: { memory_enabled: true }\n", "memory", "memory_enabled", "false")).toThrow();
});

const runelay = { url: "u", headers: { Authorization: "a" } };

test("appends the block section when it is missing", () => {
  expect(setYamlBlock("model: x", "mcp_servers", "runelay", runelay)).toBe(
    'model: x\nmcp_servers:\n  runelay:\n    url: "u"\n    headers:\n      Authorization: "a"\n',
  );
});

test("replaces only the child block and keeps siblings, comments and the next section", () => {
  const current = [
    "mcp_servers:",
    "  # servers",
    "  runelay:",
    "    url: old",
    "    timeout: 5",
    "",
    "  github:",
    "    command: npx",
    "memory:",
    "  memory_enabled: false",
  ].join("\n");
  const next = setYamlBlock(current, "mcp_servers", "runelay", runelay);
  expect(next).toBe(
    [
      "mcp_servers:",
      "  # servers",
      "  runelay:",
      '    url: "u"',
      "    headers:",
      '      Authorization: "a"',
      "",
      "  github:",
      "    command: npx",
      "memory:",
      "  memory_enabled: false",
    ].join("\n"),
  );
  expect(setYamlBlock(next, "mcp_servers", "runelay", runelay)).toBe(next);
  expect(readYamlBlock(next, "mcp_servers", "runelay")).toBe(
    '  runelay:\n    url: "u"\n    headers:\n      Authorization: "a"',
  );
  expect(readYamlBlock(next, "mcp_servers", "missing")).toBeUndefined();
});

test("adds the child block after the last server with the section indent", () => {
  const next = setYamlBlock("mcp_servers:\n    github:\n        command: npx\n\nmodel: x\n", "mcp_servers", "runelay", {
    url: "u",
  });
  expect(next).toBe('mcp_servers:\n    github:\n        command: npx\n    runelay:\n        url: "u"\n\nmodel: x\n');
});

test("refuses a flow-style block section", () => {
  expect(() => setYamlBlock("mcp_servers: {}\n", "mcp_servers", "runelay", runelay)).toThrow();
});
