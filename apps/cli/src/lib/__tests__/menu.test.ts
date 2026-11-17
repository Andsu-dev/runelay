import { expect, test } from "bun:test";
import { nameColumn, reduceMenu, renderMenu } from "../menu";

const state = { index: 0, count: 12 };

test("moves with arrows and j/k, wrapping around", () => {
  expect(reduceMenu(state, { name: "down" }).state.index).toBe(1);
  expect(reduceMenu(state, { name: "j" }).state.index).toBe(1);
  expect(reduceMenu(state, { name: "up" }).state.index).toBe(11);
  expect(reduceMenu({ index: 11, count: 12 }, { name: "k" }).state.index).toBe(10);
  expect(reduceMenu({ index: 11, count: 12 }, { name: "down" }).state.index).toBe(0);
  expect(reduceMenu(state, { name: "down" }).action).toEqual({ type: "none" });
});

test("runs the selected item on enter and by number", () => {
  expect(reduceMenu({ index: 4, count: 12 }, { name: "return" }).action).toEqual({ type: "run", index: 4 });
  const shortcut = reduceMenu(state, { sequence: "3" });
  expect(shortcut.action).toEqual({ type: "run", index: 2 });
  expect(shortcut.state.index).toBe(2);
  expect(reduceMenu({ index: 0, count: 2 }, { sequence: "5" }).action).toEqual({ type: "none" });
  expect(reduceMenu(state, { sequence: "0" }).action).toEqual({ type: "none" });
});

test("quits on q, escape and ctrl+c", () => {
  expect(reduceMenu(state, { name: "q" }).action).toEqual({ type: "quit" });
  expect(reduceMenu(state, { name: "escape" }).action).toEqual({ type: "quit" });
  expect(reduceMenu(state, { name: "c", ctrl: true }).action).toEqual({ type: "quit" });
});

test("renders accent group headers and aligns every description on one column", () => {
  const items = [
    { id: "setup", label: "setup", summary: "all of it", group: "Get started" },
    { id: "connect", label: "connect", summary: "register", group: "Get started" },
    { id: "push", label: "push", summary: "send", group: "Daily" },
    { id: "quit", label: "quit", summary: "" },
  ];
  const lines = renderMenu(items, { index: 1, count: 4 }, 80, true);
  expect(lines[0]).toBe("  Get started");
  expect(lines).toContain("  Daily");
  const row = (text: string) => lines.find((line) => line.includes(text)) ?? "";
  expect(row("connect").startsWith("› ◆ connect")).toBe(true);
  expect(row("setup").startsWith("  ▶ setup")).toBe(true);
  expect(row("all of it").indexOf("all of it")).toBe(row("register").indexOf("register"));
  expect(row("send").indexOf("send")).toBe(row("register").indexOf("register"));
  expect(row("× quit")).toBe("  × quit");
  expect(renderMenu(items, { index: 0, count: 4 }, 14, true).every((line) => line.length <= 14)).toBe(true);
  expect(nameColumn(["a", "connect", "pull"])).toBe(7);
});
