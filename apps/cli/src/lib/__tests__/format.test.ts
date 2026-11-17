import { expect, test } from "bun:test";
import { formatElapsed, maskKey, plural, relativeTime, shortPath } from "../format";

test("formats elapsed time", () => {
  expect(formatElapsed(42.4)).toBe("42ms");
  expect(formatElapsed(1430)).toBe("1.4s");
  expect(formatElapsed(63_000)).toBe("1m 3s");
});

test("formats relative time", () => {
  const now = 1_000_000_000;
  expect(relativeTime(now - 10_000, now)).toBe("just now");
  expect(relativeTime(now - 5 * 60_000, now)).toBe("5 min ago");
  expect(relativeTime(now - 3 * 3_600_000, now)).toBe("3 h ago");
  expect(relativeTime(now - 24 * 3_600_000 * 2, now)).toBe("2 days ago");
});

test("masks keys and shortens paths", () => {
  expect(maskKey("rnl_abcdefghijklmnop")).toBe("rnl_…mnop");
  expect(maskKey("short")).toBe("••••");
  expect(shortPath("/home/me/.config/runelay", "/home/me")).toBe("~/.config/runelay");
  expect(plural(1, "agent", "agents")).toBe("1 agent");
  expect(plural(2, "agent", "agents")).toBe("2 agents");
});
