import { emitKeypressEvents } from "node:readline";
import { HIDE_CURSOR, SHOW_CURSOR } from "@/constants/terminal.constants";
import {
  accent,
  bold,
  dim,
  glyphs,
  iconFor,
  padEnd,
  terminalColumns,
  truncate,
  unicode,
  visibleWidth,
} from "@/lib/terminal";

export interface MenuItem {
  id: string;
  label: string;
  summary: string;
  group?: string;
  badge?: string;
}

export interface MenuState {
  index: number;
  count: number;
}

export type MenuAction = { type: "none" } | { type: "run"; index: number } | { type: "quit" };

export interface MenuKey {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
}

export const MENU_SHORTCUTS = 9;

const move = (state: MenuState, delta: number): MenuState => ({
  ...state,
  index: (state.index + delta + state.count) % state.count,
});

export const reduceMenu = (state: MenuState, key: MenuKey): { state: MenuState; action: MenuAction } => {
  const none = (next: MenuState) => ({ state: next, action: { type: "none" } as const });
  if (key.ctrl && (key.name === "c" || key.name === "d")) return { state, action: { type: "quit" } };
  if (key.ctrl && key.name === "p") return none(move(state, -1));
  if (key.ctrl && key.name === "n") return none(move(state, 1));
  switch (key.name) {
    case "up":
    case "k":
      return none(move(state, -1));
    case "down":
    case "j":
    case "tab":
      return none(move(state, 1));
    case "home":
      return none({ ...state, index: 0 });
    case "end":
      return none({ ...state, index: state.count - 1 });
    case "return":
    case "enter":
      return { state, action: { type: "run", index: state.index } };
    case "escape":
    case "q":
      return { state, action: { type: "quit" } };
  }
  const digit = Number(key.sequence);
  if (Number.isInteger(digit) && digit >= 1 && digit <= Math.min(MENU_SHORTCUTS, state.count)) {
    const index = digit - 1;
    return { state: { ...state, index }, action: { type: "run", index } };
  }
  return none(state);
};

export const menuFooter = (separator = glyphs.meta) =>
  ["arrows or j/k move", "enter run", "1-9 shortcut", "q quit"].join(` ${separator} `);

export const nameColumn = (names: string[]) => Math.max(0, ...names.map((name) => visibleWidth(name)));

export const renderMenu = (items: MenuItem[], state: MenuState, width = terminalColumns(), useUnicode = unicode) => {
  const column = nameColumn(items.map((item) => item.label));
  const lines: string[] = [];
  let group: string | undefined;
  items.forEach((item, index) => {
    if (item.group && item.group !== group) lines.push(...(lines.length ? [""] : []), `  ${bold(accent(item.group))}`);
    if (item.group) group = item.group;
    const selected = index === state.index;
    const icon = iconFor(item.id, useUnicode);
    const head = selected
      ? `${accent(glyphs.step)} ${bold(accent(`${icon} ${padEnd(item.label, column)}`))}`
      : `  ${dim(icon)} ${padEnd(item.label, column)}`;
    const badge = item.badge ? `  ${item.badge}` : "";
    const room = Math.max(0, width - visibleWidth(head) - 2 - visibleWidth(badge));
    const summary = truncate(item.summary, room);
    lines.push(truncate(`${head}  ${selected ? summary : dim(summary)}${badge}`.trimEnd(), width));
  });
  lines.push("", truncate(`  ${dim(menuFooter())}`, width));
  return lines;
};

export const runMenu = (items: MenuItem[], initialIndex = 0) =>
  new Promise<MenuItem | null>((resolve) => {
    const { stdin, stdout } = process;
    let state: MenuState = { index: initialIndex, count: items.length };
    let drawn = 0;
    const draw = () => {
      const lines = renderMenu(items, state);
      stdout.write(`${drawn ? `\x1b[${drawn}A` : ""}\r\x1b[0J${lines.join("\n")}\n`);
      drawn = lines.length;
    };
    const restore = () => {
      if (stdin.isTTY) stdin.setRawMode(false);
      stdout.write(SHOW_CURSOR);
    };
    const finish = (item: MenuItem | null) => {
      stdin.off("keypress", onKey);
      stdout.off("resize", draw);
      process.off("exit", restore);
      stdout.write(`\x1b[${drawn}A\r\x1b[0J`);
      restore();
      stdin.pause();
      resolve(item);
    };
    const onKey = (_text: string | undefined, key: MenuKey | undefined) => {
      const next = reduceMenu(state, key ?? {});
      state = next.state;
      if (next.action.type === "run") finish(items[next.action.index] ?? null);
      else if (next.action.type === "quit") finish(null);
      else draw();
    };
    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    process.once("exit", restore);
    stdout.write(HIDE_CURSOR);
    stdout.on("resize", draw);
    stdin.on("keypress", onKey);
    draw();
  });
