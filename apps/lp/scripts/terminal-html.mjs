import { readFileSync, writeFileSync } from "node:fs";

const GRADIENT_FROM = [255, 255, 255];
const GRADIENT_TO = [154, 161, 174];
const ACCENT = [214, 219, 228];
const GRADIENT_STEPS = 7;
const NAMED = { 31: "er", 32: "ok", 33: "wn", 36: "in" };
const LOGO_PATTERN = /[▀▄█]/g;
const LOGO_MIN_BLOCKS = 4;

const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const rgbClass = ([r, g, b]) => {
  if (r === ACCENT[0] && g === ACCENT[1] && b === ACCENT[2]) return "ac";
  const t = (GRADIENT_FROM[0] - r) / (GRADIENT_FROM[0] - GRADIENT_TO[0]);
  return `g${Math.max(0, Math.min(GRADIENT_STEPS, Math.round(t * GRADIENT_STEPS)))}`;
};

const applySgr = (style, params) => {
  const codes = params.length ? params.split(";").map(Number) : [0];
  for (let index = 0; index < codes.length; index++) {
    const code = codes[index];
    if (code === 0) Object.assign(style, { bold: false, dim: false, color: "" });
    else if (code === 1) style.bold = true;
    else if (code === 2) style.dim = true;
    else if (code === 22) Object.assign(style, { bold: false, dim: false });
    else if (code === 39) style.color = "";
    else if (NAMED[code]) style.color = NAMED[code];
    else if (code === 38 && codes[index + 1] === 2) {
      style.color = rgbClass(codes.slice(index + 2, index + 5));
      index += 4;
    }
  }
};

const classOf = ({ bold, dim, color }) => [bold && "b", dim && "d", color].filter(Boolean).join(" ");

const render = (raw) => {
  const rows = [];
  const style = { bold: false, dim: false, color: "" };
  let row = 0;
  let col = 0;
  let peak = [];
  const line = (index) => (rows[index] ??= []);
  const filled = (grid) => grid.filter((cells) => cells?.some((cell) => cell?.char.trim())).length;
  const keepPeak = () => {
    if (filled(rows) > filled(peak)) peak = Array.from(rows, (cells) => (cells ? [...cells] : cells));
  };
  const clearLine = (index, from, to) => {
    const cells = line(index);
    for (let c = from; c < Math.min(to, cells.length); c++) cells[c] = undefined;
    if (to === Infinity) cells.length = Math.min(cells.length, from);
  };
  const text = raw.replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, "");
  const pattern = /\x1b\[([?0-9;]*)([A-Za-z])|([\s\S])/g;
  for (const [, params, command, char] of text.matchAll(pattern)) {
    if (char !== undefined) {
      if (char === "\n") {
        row++;
        col = 0;
      } else if (char === "\r") col = 0;
      else if (char === "\b") col = Math.max(0, col - 1);
      else if (char >= " ") line(row)[col++] = { char, cls: classOf(style) };
      continue;
    }
    if (params.startsWith("?")) continue;
    const n = Number(params) || 1;
    if (command === "m") applySgr(style, params);
    else if (command === "A") row = Math.max(0, row - n);
    else if (command === "B") row += n;
    else if (command === "C") col += n;
    else if (command === "D") col = Math.max(0, col - n);
    else if (command === "G") col = n - 1;
    else if (command === "H") {
      const [r = 1, c = 1] = params.split(";").map(Number);
      row = r - 1;
      col = c - 1;
    } else if (command === "K") {
      const mode = Number(params) || 0;
      clearLine(row, mode === 0 ? col : 0, mode === 1 ? col + 1 : Infinity);
    } else if (command === "J") {
      keepPeak();
      const mode = Number(params) || 0;
      if (mode === 0) {
        clearLine(row, col, Infinity);
        rows.length = Math.min(rows.length, row + 1);
      } else rows.length = 0;
    }
  }
  keepPeak();
  return Array.from(peak, (cells = []) => {
    const chars = Array.from({ length: cells.length }, (_, index) => cells[index] ?? { char: " ", cls: "" });
    while (chars.length && chars.at(-1).char === " " && !chars.at(-1).cls) chars.pop();
    return chars;
  });
};

const toHtml = (cells) => {
  let html = "";
  let current = null;
  let buffer = "";
  const flush = () => {
    if (buffer) html += current ? `<span class="${current}">${escape(buffer)}</span>` : escape(buffer);
    buffer = "";
  };
  for (const { char, cls } of cells) {
    const effective = char === " " && !cls.includes("b") ? current ?? "" : cls;
    if (effective !== (current ?? "")) {
      flush();
      current = effective || null;
    }
    buffer += char;
  }
  flush();
  return html.replace(/(\s+)<\/span>$/, "</span>") || " ";
};

const trimBlank = (rows) => {
  const blank = (cells) => !cells.some(({ char }) => char.trim());
  let start = 0;
  let end = rows.length;
  while (start < end && blank(rows[start])) start++;
  while (end > start && blank(rows[end - 1])) end--;
  return rows.slice(start, end);
};

const fragment = (rows) => {
  const out = [];
  let logo = [];
  const flushLogo = () => {
    if (logo.length) out.push(`<span class="logo" aria-hidden="true">${logo.join("")}</span>`);
    logo = [];
  };
  for (const cells of rows) {
    const row = `<span class="r">${toHtml(cells)}</span>`;
    const text = cells.map(({ char }) => char).join("");
    if ((text.match(LOGO_PATTERN) ?? []).length >= LOGO_MIN_BLOCKS) logo.push(row);
    else {
      flushLogo();
      out.push(row);
    }
  }
  flushLogo();
  return out.join("");
};

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/terminal-html.mjs <capture.raw> <partial.html>");
  process.exit(1);
}
const html = fragment(trimBlank(render(readFileSync(input, "utf8"))));
writeFileSync(output, `${html}\n`);
console.log(`${output} ${Buffer.byteLength(html)} bytes`);
