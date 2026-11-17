import { expect, test } from "bun:test";
import { LOGO_ROWS, WORDMARK_ROWS, WORDMARK_TOP_ROW } from "../../constants/banner.constants";
import { bannerMode, renderBanner, renderCompactBanner } from "../banner";
import { rasterizeLogo } from "./logo-raster";

test("never shows the banner with --json or without a TTY", () => {
  expect(bannerMode({ args: ["--json"], env: {}, isTTY: true })).toBe("off");
  expect(bannerMode({ args: [], env: {}, isTTY: false })).toBe("off");
  expect(bannerMode({ args: [], env: {}, isTTY: true })).toBe("animated");
});

test("prints a static banner without motion when NO_COLOR, CI or --no-motion", () => {
  expect(bannerMode({ args: [], env: { NO_COLOR: "1" }, isTTY: true })).toBe("static");
  expect(bannerMode({ args: [], env: { CI: "1" }, isTTY: true })).toBe("static");
  expect(bannerMode({ args: ["--no-motion"], env: {}, isTTY: true })).toBe("static");
  expect(bannerMode({ args: [], env: { RUNELAY_NO_MOTION: "1" }, isTTY: true })).toBe("static");
});

test("renders no escape codes without color", () => {
  const lines = renderBanner({ version: "1.2.3", depth: 0, columns: 120 });
  expect(lines).toHaveLength(LOGO_ROWS.length);
  expect(lines.join("\n")).not.toContain("\x1b");
  expect(lines.at(-1)).toContain("v1.2.3");
  expect(renderCompactBanner({ version: "1.2.3", depth: 0 })).toBe("▄▀ runelay v1.2.3");
});

test("paints a vertical white to gray gradient in 24-bit color", () => {
  const lines = renderBanner({ version: "1.2.3", depth: 24, columns: 120 });
  expect(lines[0]).toContain("38;2;255;255;255");
  expect(lines.at(-1)).toContain("38;2;154;161;174");
});

test("falls back to a narrow layout on small terminals", () => {
  const lines = renderBanner({ version: "1.2.3", depth: 0, columns: 40 });
  expect(lines.every((line) => line.length <= 40)).toBe(true);
  expect(lines.join("\n")).toContain("runelay");
});

test("bakes the mark rasterized from the two half-discs of the logo", () => {
  expect(LOGO_ROWS).toEqual(rasterizeLogo());
  expect(LOGO_ROWS.every((row) => row[8] === " ")).toBe(true);
});

test("centers the wordmark vertically against the mark", () => {
  const below = LOGO_ROWS.length - WORDMARK_TOP_ROW - WORDMARK_ROWS.length;
  expect(WORDMARK_TOP_ROW).toBe(below);
  const lines = renderBanner({ version: "1.2.3", depth: 0, columns: 120 });
  expect(lines[0]?.trim()).toBe(LOGO_ROWS[0]?.trim());
  expect(lines[WORDMARK_TOP_ROW]).toContain(WORDMARK_ROWS[0]?.trimEnd() ?? "");
});
