import { expect, test } from "bun:test";
import { readTomlValue, setTomlValue } from "../toml";

test("creates the table when the file has none", () => {
  expect(setTomlValue("", "memory", "enabled", "false")).toBe("[memory]\nenabled = false\n");
  expect(setTomlValue('model = "x"\n', "memory", "enabled", "false")).toBe(
    'model = "x"\n\n[memory]\nenabled = false\n',
  );
});

test("replaces the key inside its table and keeps the other tables", () => {
  const current = '[memory]\nenabled = true # on\n\n[mcp_servers.runelay]\nurl = "https://x/v1/mcp"\n';
  const next = setTomlValue(current, "memory", "enabled", "false");
  expect(next).toBe('[memory]\nenabled = false\n\n[mcp_servers.runelay]\nurl = "https://x/v1/mcp"\n');
  expect(readTomlValue(next, "memory", "enabled")).toBe("false");
  expect(readTomlValue(current, "memory", "enabled")).toBe("true");
});

test("adds the key to an existing table without touching a similar table", () => {
  const current = "[memory_v2]\nmax = 3\n[memory]\nmax = 1\n";
  const next = setTomlValue(current, "memory", "enabled", "false");
  expect(readTomlValue(next, "memory", "enabled")).toBe("false");
  expect(readTomlValue(next, "memory_v2", "enabled")).toBeUndefined();
});

test("updates a root dotted key instead of adding a duplicate table", () => {
  const next = setTomlValue("memory.enabled = true\n[other]\na = 1\n", "memory", "enabled", "false");
  expect(next).toBe("memory.enabled = false\n[other]\na = 1\n");
});

test("refuses an inline table", () => {
  expect(() => setTomlValue("memory = { enabled = true }\n", "memory", "enabled", "false")).toThrow();
});
