import { createInterface } from "node:readline/promises";
import {
  ACCENT,
  ASCII_SYMBOLS,
  type BoxChars,
  DEFAULT_COLUMNS,
  GRADIENT_FROM,
  GRADIENT_TO,
  HYPERLINK_TERMINALS,
  NO_MOTION_FLAG,
  type Rgb,
  type SymbolSet,
  UNICODE_SYMBOLS,
} from "@/constants/terminal.constants";
import { COMMAND_ICONS, FALLBACK_ICON } from "@/constants/ui.constants";
import { JSON_FLAG } from "@/lib/json-output";

export type Env = Record<string, string | undefined>;

export type ColorDepth = 0 | 16 | 256 | 24;

const enabled = (value: string | undefined) => Boolean(value) && value !== "0" && value !== "false";

const jsonMode = process.argv.includes(JSON_FLAG);

export const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY) && !jsonMode;

export const decorated = Boolean(process.stdout.isTTY) && !jsonMode;

export const detectColorDepth = (env: Env, isTTY: boolean): ColorDepth => {
  if (!isTTY || enabled(env.NO_COLOR) || env.TERM === "dumb") return 0;
  if (/^(truecolor|24bit)$/i.test(env.COLORTERM ?? "") || env.WT_SESSION) return 24;
  if (/256/.test(env.TERM ?? "")) return 256;
  return 16;
};

export const detectMotion = (args: string[], env: Env, isTTY: boolean) =>
  isTTY &&
  !args.includes(NO_MOTION_FLAG) &&
  !args.includes(JSON_FLAG) &&
  !enabled(env.NO_COLOR) &&
  !enabled(env.CI) &&
  !enabled(env.RUNELAY_NO_MOTION) &&
  env.TERM !== "dumb";

export const detectUnicode = (env: Env, platform: string) =>
  platform !== "win32"
    ? env.TERM !== "linux"
    : Boolean(env.WT_SESSION || env.TERM_PROGRAM === "vscode" || env.TERM === "xterm-256color" || env.TERM === "alacritty");

export const detectHyperlinks = (env: Env, isTTY: boolean) => {
  if (!isTTY || enabled(env.CI)) return false;
  if (env.FORCE_HYPERLINK !== undefined) return enabled(env.FORCE_HYPERLINK);
  if (env.WT_SESSION || env.KITTY_WINDOW_ID || env.WEZTERM_PANE || env.GHOSTTY_RESOURCES_DIR) return true;
  if (HYPERLINK_TERMINALS.includes(env.TERM_PROGRAM ?? "")) return true;
  if (Number(env.VTE_VERSION) >= 5000) return true;
  return /kitty|ghostty|wezterm|foot/.test(env.TERM ?? "");
};

export const symbolsFor = (unicode: boolean): SymbolSet => (unicode ? UNICODE_SYMBOLS : ASCII_SYMBOLS);

export const colorDepth = detectColorDepth(process.env, decorated);

export const motion = detectMotion(process.argv, process.env, decorated);

export const unicode = detectUnicode(process.env, process.platform);

export const glyphs = symbolsFor(unicode);

export const hyperlinks = detectHyperlinks(process.env, decorated);

export const iconFor = (id: string, useUnicode = unicode) => {
  const icon = COMMAND_ICONS[id] ?? FALLBACK_ICON;
  return useUnicode ? icon.unicode : icon.ascii;
};

const paint = (open: number, close: number) => (text: string) =>
  colorDepth ? `\x1b[${open}m${text}\x1b[${close}m` : text;

export const bold = paint(1, 22);
export const dim = paint(2, 22);
export const green = paint(32, 39);
export const red = paint(31, 39);
export const yellow = paint(33, 39);
export const cyan = paint(36, 39);

const to256 = ([r, g, b]: Rgb) => {
  if (Math.max(r, g, b) - Math.min(r, g, b) < 24) {
    const gray = (r + g + b) / 3;
    if (gray < 8) return 16;
    if (gray > 248) return 231;
    return 232 + Math.round(((gray - 8) / 247) * 23);
  }
  const level = (value: number) => Math.round((value / 255) * 5);
  return 16 + 36 * level(r) + 6 * level(g) + level(b);
};

const to16 = ([r, g, b]: Rgb) => {
  const gray = (r + g + b) / 3;
  return gray > 200 ? 97 : gray > 120 ? 37 : 90;
};

export const rgbCode = (color: Rgb, depth: ColorDepth): string | null => {
  if (depth === 24) return `38;2;${color.join(";")}`;
  if (depth === 256) return `38;5;${to256(color)}`;
  if (depth === 16) return String(to16(color));
  return null;
};

export const paintRgb =
  (color: Rgb, depth: ColorDepth = colorDepth) =>
  (text: string) => {
    const code = rgbCode(color, depth);
    return code ? `\x1b[${code}m${text}\x1b[39m` : text;
  };

const mixChannel = (from: number, to: number, amount: number) => Math.round(from + (to - from) * amount);

export const mixRgb = ([r1, g1, b1]: Rgb, [r2, g2, b2]: Rgb, amount: number): Rgb => [
  mixChannel(r1, r2, amount),
  mixChannel(g1, g2, amount),
  mixChannel(b1, b2, amount),
];

export const gradientAt = (index: number, total: number): Rgb =>
  mixRgb(GRADIENT_FROM, GRADIENT_TO, total <= 1 ? 0 : index / (total - 1));

export const accent = paintRgb(ACCENT);

export const mark = {
  ok: green(glyphs.ok),
  warn: yellow(glyphs.warn),
  error: red(glyphs.error),
  step: accent(glyphs.step),
  meta: dim(glyphs.meta),
};

const ESC = "\u001b";
const BEL = "\u0007";
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]|${ESC}\\]8;[^${ESC}${BEL}]*(?:${ESC}\\\\|${BEL})`, "g");

export const stripAnsi = (text: string) => text.replace(ANSI_PATTERN, "");

export const visibleWidth = (text: string) => [...stripAnsi(text)].length;

export const truncate = (text: string, width: number, ellipsis = glyphs.ellipsis) => {
  if (visibleWidth(text) <= width) return text;
  const limit = Math.max(0, width - [...ellipsis].length);
  let output = "";
  let count = 0;
  let cut = false;
  let last = 0;
  const takeChars = (plain: string) => {
    for (const char of plain) {
      if (count < limit) {
        output += char;
        count += 1;
      } else if (!cut) {
        output += ellipsis;
        cut = true;
      }
    }
  };
  for (const match of text.matchAll(ANSI_PATTERN)) {
    takeChars(text.slice(last, match.index));
    output += match[0];
    last = (match.index ?? 0) + match[0].length;
  }
  takeChars(text.slice(last));
  return output;
};

export const wrap = (text: string, width: number) =>
  text.split("\n").flatMap((paragraph) => {
    const lines: string[] = [];
    let current = "";
    for (const word of paragraph.split(" ")) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && visibleWidth(candidate) > width) {
        lines.push(current);
        current = word;
      } else current = candidate;
    }
    lines.push(current);
    return lines;
  });

export const padEnd = (text: string, width: number) => `${text}${" ".repeat(Math.max(0, width - visibleWidth(text)))}`;

export const terminalColumns = () => process.stdout.columns || DEFAULT_COLUMNS;

export interface BoxOptions {
  title?: string;
  maxWidth?: number;
  paintBorder?: (text: string) => string;
  chars?: BoxChars;
}

export const drawBox = (
  lines: string[],
  { title, maxWidth = DEFAULT_COLUMNS, paintBorder = (text) => text, chars = glyphs.box }: BoxOptions = {},
) => {
  const { topLeft, topRight, bottomLeft, bottomRight, horizontal, vertical } = chars;
  const titleWidth = title ? visibleWidth(title) : 0;
  const widest = Math.max(0, ...lines.map(visibleWidth), title ? titleWidth + 1 : 0);
  const inner = Math.max(1, Math.min(maxWidth - 4, widest));
  const shownTitle = title ? truncate(title, Math.max(1, inner - 1)) : "";
  const top = title
    ? `${paintBorder(`${topLeft}${horizontal} `)}${shownTitle}${paintBorder(` ${horizontal.repeat(Math.max(0, inner - visibleWidth(shownTitle) - 1))}${topRight}`)}`
    : paintBorder(`${topLeft}${horizontal.repeat(inner + 2)}${topRight}`);
  const side = paintBorder(vertical);
  return [
    top,
    ...lines.map((line) => `${side} ${padEnd(truncate(line, inner), inner)} ${side}`),
    paintBorder(`${bottomLeft}${horizontal.repeat(inner + 2)}${bottomRight}`),
  ];
};

export const hyperlink = (text: string, url: string, supported = hyperlinks) => {
  if (supported) return `${ESC}]8;;${url}${ESC}\\${text}${ESC}]8;;${ESC}\\`;
  return text === url ? text : `${text} (${url})`;
};

export const fileLink = (path: string, label = path, supported = hyperlinks) =>
  supported ? hyperlink(label, `file://${encodeURI(path)}`, true) : label;

export const ask = async (question: string, fallback = "") => {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await reader.question(`${accent("?")} ${question}${fallback ? dim(` (${fallback})`) : ""} `);
  reader.close();
  return answer.trim() || fallback;
};

export const confirm = async (question: string) => {
  const answer = await ask(`${question} ${dim("[Y/n]")}`);
  return !/^n/i.test(answer);
};
