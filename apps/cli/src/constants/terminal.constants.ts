export type Rgb = readonly [number, number, number];

export interface BoxChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  horizontal: string;
  vertical: string;
}

export interface SymbolSet {
  ok: string;
  warn: string;
  error: string;
  step: string;
  meta: string;
  bullet: string;
  pointer: string;
  ellipsis: string;
  arrow: string;
  spinner: string[];
  box: BoxChars;
}

export const UNICODE_SYMBOLS: SymbolSet = {
  ok: "✓",
  warn: "!",
  error: "✗",
  step: "›",
  meta: "·",
  bullet: "●",
  pointer: "❯",
  ellipsis: "…",
  arrow: "→",
  spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  box: { topLeft: "╭", topRight: "╮", bottomLeft: "╰", bottomRight: "╯", horizontal: "─", vertical: "│" },
};

export const ASCII_SYMBOLS: SymbolSet = {
  ok: "+",
  warn: "!",
  error: "x",
  step: ">",
  meta: "-",
  bullet: "*",
  pointer: ">",
  ellipsis: "...",
  arrow: "->",
  spinner: ["-", "\\", "|", "/"],
  box: { topLeft: "+", topRight: "+", bottomLeft: "+", bottomRight: "+", horizontal: "-", vertical: "|" },
};

export const GRADIENT_FROM: Rgb = [255, 255, 255];

export const GRADIENT_TO: Rgb = [154, 161, 174];

export const ACCENT: Rgb = [214, 219, 228];

export const SPINNER_INTERVAL_MS = 80;

export const REVEAL_DELAY_MS = 30;

export const DEFAULT_COLUMNS = 80;

export const NO_MOTION_FLAG = "--no-motion";

export const VERBOSE_FLAG = "--verbose";

export const HIDE_CURSOR = "\x1b[?25l";

export const SHOW_CURSOR = "\x1b[?25h";

export const CLEAR_LINE = "\r\x1b[2K";

export const HYPERLINK_TERMINALS = [
  "iTerm.app",
  "WezTerm",
  "vscode",
  "ghostty",
  "Hyper",
  "Tabby",
  "rio",
  "WarpTerminal",
];
