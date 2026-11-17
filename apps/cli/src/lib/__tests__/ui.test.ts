import { expect, test } from "bun:test";
import { ASCII_SYMBOLS, UNICODE_SYMBOLS } from "../../constants/terminal.constants";
import { visibleWidth } from "../terminal";
import { describeError, formatRow, formatStepLine, renderCard, renderErrorBox } from "../ui";

test("resolves a step line to its final symbol with elapsed time", () => {
  const base = { label: "Registering", width: 60, symbols: UNICODE_SYMBOLS };
  expect(formatStepLine({ ...base, tone: "ok", detail: "3 agents", elapsedMs: 1200 })).toBe(
    "✓ Registering · 3 agents  1.2s",
  );
  expect(formatStepLine({ ...base, tone: "warn" })).toBe("! Registering");
  expect(formatStepLine({ ...base, tone: "error", symbols: ASCII_SYMBOLS })).toBe("x Registering");
});

test("truncates a step line but keeps the elapsed time visible", () => {
  const line = formatStepLine({
    tone: "ok",
    label: "A very long step label that will not fit",
    elapsedMs: 300,
    width: 24,
    symbols: UNICODE_SYMBOLS,
  });
  expect(visibleWidth(line)).toBe(24);
  expect(line.endsWith("300ms")).toBe(true);
  expect(line).toContain("…");
});

test("aligns agent rows on the name column", () => {
  const first = formatRow({ tone: "ok", name: "Codex", message: "now uses runelay", symbols: UNICODE_SYMBOLS });
  const second = formatRow({ tone: "skip", name: "Claude Code", message: "skipped", symbols: UNICODE_SYMBOLS });
  expect(first).toBe("  ✓ Codex          now uses runelay");
  expect(first.indexOf("now")).toBe(second.indexOf("skipped"));
});

test("renders a summary card boxed in a terminal and plain otherwise", () => {
  const card = {
    title: "Pushed",
    stats: [
      ["Memories", "3 sent"],
      ["Skills", "1 sent"],
    ] as [string, string][],
    next: "runelay pull",
  };
  const boxed = renderCard(card, { width: 80, boxed: true });
  expect(boxed[0]?.startsWith("╭─ Pushed")).toBe(true);
  expect(boxed.at(-1)?.startsWith("╰")).toBe(true);
  expect(boxed.some((line) => line.includes("Next step: runelay pull"))).toBe(true);
  expect(new Set(boxed.map(visibleWidth)).size).toBe(1);
  expect(renderCard(card, { boxed: false })).toEqual([
    "Pushed",
    "  Memories: 3 sent",
    "  Skills: 1 sent",
    "Next step: runelay pull",
  ]);
});

test("explains an error with why and fix, never a stack by default", () => {
  const view = describeError({ code: "UNAUTHORIZED", message: "You're not logged in." }, "status");
  expect(view.fix).toBe("runelay login");
  expect(describeError({ code: "INVALID_INPUT", message: "bad" }, "migrate").fix).toBe("runelay migrate --help");
  expect(describeError({ code: "INTERNAL", message: "boom" }).fix).toContain("--verbose");
  const plain = renderErrorBox(view, { boxed: false });
  expect(plain).toEqual([
    "error: You're not logged in.",
    "why: This computer has no valid runelay key.",
    "fix: runelay login",
  ]);
  const boxed = renderErrorBox({ ...view, details: "stack line" }, { boxed: true, width: 60 });
  expect(boxed.some((line) => line.includes("stack line"))).toBe(true);
  expect(new Set(boxed.map(visibleWidth)).size).toBe(1);
});

test("shows the card footer only inside a terminal box", () => {
  const card = {
    title: "All set",
    stats: [["Agents", "3"]] as [string, string][],
    footer: "Enjoying runelay? Sponsor: x",
  };
  expect(renderCard(card, { boxed: true, width: 80 }).some((line) => line.includes("Sponsor"))).toBe(true);
  expect(renderCard(card, { boxed: false }).some((line) => line.includes("Sponsor"))).toBe(false);
});
