import { expect, test } from "bun:test";
import { ASCII_SYMBOLS, UNICODE_SYMBOLS } from "../../constants/terminal.constants";
import {
  detectColorDepth,
  detectHyperlinks,
  detectMotion,
  detectUnicode,
  drawBox,
  gradientAt,
  hyperlink,
  rgbCode,
  stripAnsi,
  symbolsFor,
  truncate,
  visibleWidth,
  wrap,
} from "../terminal";

test("picks the color depth from the environment", () => {
  expect(detectColorDepth({ COLORTERM: "truecolor" }, true)).toBe(24);
  expect(detectColorDepth({ COLORTERM: "24bit", TERM: "xterm" }, true)).toBe(24);
  expect(detectColorDepth({ TERM: "xterm-256color" }, true)).toBe(256);
  expect(detectColorDepth({ TERM: "xterm" }, true)).toBe(16);
  expect(detectColorDepth({ COLORTERM: "truecolor", NO_COLOR: "1" }, true)).toBe(0);
  expect(detectColorDepth({ TERM: "dumb" }, true)).toBe(0);
  expect(detectColorDepth({ COLORTERM: "truecolor" }, false)).toBe(0);
});

test("falls the gradient back to 256 and 16 colors", () => {
  const top = gradientAt(0, 7);
  const bottom = gradientAt(6, 7);
  expect(top).toEqual([255, 255, 255]);
  expect(bottom).toEqual([154, 161, 174]);
  expect(rgbCode(bottom, 24)).toBe("38;2;154;161;174");
  expect(rgbCode(top, 256)).toBe("38;5;231");
  expect(rgbCode(bottom, 256)).toMatch(/^38;5;(24[0-9]|25[0-5]|23[2-9])$/);
  expect(rgbCode(top, 16)).toBe("97");
  expect(rgbCode(bottom, 16)).toBe("37");
  expect(rgbCode(top, 0)).toBeNull();
});

test("uses ASCII symbols where the terminal has no unicode", () => {
  expect(detectUnicode({}, "darwin")).toBe(true);
  expect(detectUnicode({ TERM: "linux" }, "linux")).toBe(false);
  expect(detectUnicode({}, "win32")).toBe(false);
  expect(detectUnicode({ WT_SESSION: "1" }, "win32")).toBe(true);
  expect(symbolsFor(true)).toBe(UNICODE_SYMBOLS);
  expect(symbolsFor(false)).toBe(ASCII_SYMBOLS);
  expect(ASCII_SYMBOLS.spinner.every((frame) => /^[\x20-\x7e]+$/.test(frame))).toBe(true);
});

test("turns motion off for json, flags and reduced-motion env", () => {
  expect(detectMotion([], {}, true)).toBe(true);
  expect(detectMotion([], {}, false)).toBe(false);
  expect(detectMotion(["--json"], {}, true)).toBe(false);
  expect(detectMotion(["--no-motion"], {}, true)).toBe(false);
  expect(detectMotion([], { NO_COLOR: "1" }, true)).toBe(false);
  expect(detectMotion([], { CI: "true" }, true)).toBe(false);
  expect(detectMotion([], { RUNELAY_NO_MOTION: "1" }, true)).toBe(false);
  expect(detectMotion([], { RUNELAY_NO_MOTION: "0" }, true)).toBe(true);
});

test("truncates by visible width and keeps escape codes", () => {
  const painted = "\x1b[32mhello world\x1b[39m";
  expect(visibleWidth(painted)).toBe(11);
  expect(truncate("hello world", 20)).toBe("hello world");
  expect(truncate("hello world", 6, "…")).toBe("hello…");
  expect(stripAnsi(truncate(painted, 6, "…"))).toBe("hello…");
  expect(truncate(painted, 6, "…").endsWith("\x1b[39m")).toBe(true);
  expect(truncate("hello world", 8, "...")).toBe("hello...");
});

test("wraps text on word boundaries", () => {
  expect(wrap("one two three four", 9)).toEqual(["one two", "three", "four"]);
});

test("draws a rounded box padded to the widest line", () => {
  const box = drawBox(["ab", "abcd"], { title: "T", chars: UNICODE_SYMBOLS.box });
  expect(box).toEqual(["╭─ T ──╮", "│ ab   │", "│ abcd │", "╰──────╯"]);
  expect(new Set(box.map(visibleWidth)).size).toBe(1);
  const ascii = drawBox(["x"], { chars: ASCII_SYMBOLS.box });
  expect(ascii).toEqual(["+---+", "| x |", "+---+"]);
});

test("caps the box at the terminal width with an ellipsis", () => {
  const box = drawBox(["a".repeat(50)], { maxWidth: 20, chars: UNICODE_SYMBOLS.box });
  expect(box.every((line) => visibleWidth(line) === 20)).toBe(true);
  expect(box[1]).toContain("…");
});

test("writes OSC 8 links only where supported", () => {
  expect(hyperlink("docs", "https://runelay.com", true)).toBe("\x1b]8;;https://runelay.com\x1b\\docs\x1b]8;;\x1b\\");
  expect(hyperlink("docs", "https://runelay.com", false)).toBe("docs (https://runelay.com)");
  expect(hyperlink("https://runelay.com", "https://runelay.com", false)).toBe("https://runelay.com");
  expect(visibleWidth(hyperlink("docs", "https://runelay.com", true))).toBe(4);
  expect(detectHyperlinks({ TERM_PROGRAM: "iTerm.app" }, true)).toBe(true);
  expect(detectHyperlinks({ TERM_PROGRAM: "Apple_Terminal" }, true)).toBe(false);
  expect(detectHyperlinks({ TERM_PROGRAM: "iTerm.app" }, false)).toBe(false);
  expect(detectHyperlinks({ FORCE_HYPERLINK: "1" }, true)).toBe(true);
});
