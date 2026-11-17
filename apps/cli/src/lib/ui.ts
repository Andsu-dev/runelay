import type { AppError } from "@runelay/shared";
import { ERROR_HINTS, type ErrorHint, FALLBACK_ERROR_HINT } from "@/constants/ui.constants";
import {
  CLEAR_LINE,
  HIDE_CURSOR,
  SHOW_CURSOR,
  SPINNER_INTERVAL_MS,
  type SymbolSet,
} from "@/constants/terminal.constants";
import { formatElapsed } from "@/lib/format";
import {
  accent,
  bold,
  decorated,
  dim,
  drawBox,
  glyphs,
  green,
  motion,
  padEnd,
  red,
  terminalColumns,
  truncate,
  visibleWidth,
  wrap,
  yellow,
} from "@/lib/terminal";

export type Tone = "ok" | "warn" | "error" | "info" | "skip";

export const AGENT_COLUMN = 14;

const TONE_PAINT: Record<Tone, (text: string) => string> = {
  ok: green,
  warn: yellow,
  error: red,
  info: accent,
  skip: dim,
};

const toneGlyph = (tone: Tone, symbols: SymbolSet) =>
  ({ ok: symbols.ok, warn: symbols.warn, error: symbols.error, info: symbols.step, skip: symbols.meta })[tone];

export const toneMark = (tone: Tone, symbols: SymbolSet = glyphs) => TONE_PAINT[tone](toneGlyph(tone, symbols));

export interface StepLine {
  tone: Tone;
  label: string;
  detail?: string;
  elapsedMs?: number;
  width: number;
  symbols?: SymbolSet;
}

export const formatStepLine = ({ tone, label, detail, elapsedMs, width, symbols = glyphs }: StepLine) => {
  const time = elapsedMs === undefined ? "" : `  ${dim(formatElapsed(elapsedMs))}`;
  const head = `${toneMark(tone, symbols)} ${tone === "error" ? label : bold(label)}`;
  const tail = detail ? ` ${dim(symbols.meta)} ${detail}` : "";
  return `${truncate(`${head}${tail}`, Math.max(8, width - visibleWidth(time)), symbols.ellipsis)}${time}`;
};

export interface RowInput {
  tone: Tone;
  name: string;
  message: string;
  width?: number;
  nameWidth?: number;
  symbols?: SymbolSet;
}

export const formatRow = ({
  tone,
  name,
  message,
  width = terminalColumns(),
  nameWidth = AGENT_COLUMN,
  symbols = glyphs,
}: RowInput) =>
  truncate(
    `  ${toneMark(tone, symbols)} ${padEnd(name, nameWidth)} ${tone === "skip" ? dim(message) : message}`,
    width,
    symbols.ellipsis,
  );

export const formatNote = (text: string, width = terminalColumns()) => truncate(`    ${dim(text)}`, width);

export interface Step {
  row: (text: string) => void;
  done: (detail?: string) => void;
  warn: (detail?: string) => void;
  fail: (detail?: string) => void;
  skip: (detail?: string) => void;
}

const showCursor = () => process.stdout.write(SHOW_CURSOR);

export const startStep = (label: string): Step => {
  const started = performance.now();
  const live = decorated;
  const buffered: string[] = [];
  let offset = 0;
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  const header = () =>
    `${motion ? accent(glyphs.spinner[frame] ?? glyphs.step) : accent(glyphs.step)} ${truncate(label, terminalColumns() - 2)}`;
  const writeHeader = (text: string) => {
    if (!offset) return process.stdout.write(`${CLEAR_LINE}${text}`);
    if (offset >= (process.stdout.rows || 24)) return;
    process.stdout.write(`\x1b[${offset}A${CLEAR_LINE}${text}\x1b[${offset}B\r`);
  };
  if (live) {
    process.stdout.write(HIDE_CURSOR);
    process.once("exit", showCursor);
    writeHeader(header());
    if (motion)
      timer = setInterval(() => {
        frame = (frame + 1) % glyphs.spinner.length;
        writeHeader(header());
      }, SPINNER_INTERVAL_MS);
  }
  const finish = (tone: Tone) => (detail?: string) => {
    if (timer) clearInterval(timer);
    const line = formatStepLine({
      tone,
      label,
      detail,
      elapsedMs: live ? performance.now() - started : undefined,
      width: terminalColumns(),
    });
    if (!live) {
      console.log(line);
      for (const row of buffered) console.log(row);
      return;
    }
    writeHeader(line);
    if (!offset) process.stdout.write("\n");
    showCursor();
    process.off("exit", showCursor);
  };
  return {
    row: (text) => {
      if (!live) {
        buffered.push(text);
        return;
      }
      if (!offset) {
        process.stdout.write("\n");
        offset = 1;
      }
      process.stdout.write(`${truncate(text, terminalColumns())}\n`);
      offset += 1;
    },
    done: finish("ok"),
    warn: finish("warn"),
    fail: finish("error"),
    skip: finish("skip"),
  };
};

export interface CardInput {
  title: string;
  stats: [string, string][];
  next?: string;
  footer?: string;
}

export const NEXT_STEP_LABEL = "Next step:";

export const renderCard = (
  { title, stats, next, footer }: CardInput,
  { width = terminalColumns(), boxed = decorated }: { width?: number; boxed?: boolean } = {},
) => {
  const labelWidth = Math.max(0, ...stats.map(([label]) => visibleWidth(label)));
  if (!boxed)
    return [
      title,
      ...stats.map(([label, value]) => `  ${label}: ${value}`),
      ...(next ? [`${NEXT_STEP_LABEL} ${next}`] : []),
    ];
  const lines = stats.map(([label, value]) => `${dim(padEnd(label, labelWidth))}  ${value}`);
  if (next) lines.push("", `${accent(glyphs.arrow)} ${bold(NEXT_STEP_LABEL)} ${next}`);
  if (footer) lines.push(dim(footer));
  return drawBox(lines, { title: bold(title), maxWidth: Math.min(width, 100), paintBorder: dim });
};

export const printCard = (input: CardInput) => console.log(["", ...renderCard(input)].join("\n"));

export interface ErrorView {
  what: string;
  why: string;
  fix: string;
  details?: string;
}

export const describeError = (
  error: Pick<AppError, "code" | "message">,
  command?: string,
  override?: ErrorHint,
): ErrorView => {
  const hint = override ?? ERROR_HINTS[error.code] ?? FALLBACK_ERROR_HINT;
  return {
    what: error.message,
    why: hint.why,
    fix: error.code === "INVALID_INPUT" && command ? `runelay ${command} --help` : hint.fix,
  };
};

export const renderErrorBox = (
  { what, why, fix, details }: ErrorView,
  { width = terminalColumns(), boxed = decorated }: { width?: number; boxed?: boolean } = {},
) => {
  const extra = details ? details.split("\n") : [];
  if (!boxed) return [`error: ${what}`, `why: ${why}`, `fix: ${fix}`, ...extra];
  const maxWidth = Math.min(width, 100);
  const inner = maxWidth - 4;
  const labeled = (label: string, text: string, paint: (value: string) => string) =>
    wrap(text, inner - 5).map((line, index) => `${dim(padEnd(index ? "" : label, 4))} ${paint(line)}`);
  return drawBox(
    [
      ...wrap(what, inner).map((line) => bold(line)),
      "",
      ...labeled("Why", why, (line) => line),
      ...labeled("Fix", fix, accent),
      ...(extra.length ? ["", ...extra.map((line) => dim(line))] : []),
    ],
    { title: red(bold(`${glyphs.error} Error`)), maxWidth, paintBorder: red },
  );
};
