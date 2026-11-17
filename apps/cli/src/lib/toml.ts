const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const tableHeader = (table: string) => new RegExp(`^\\s*\\[\\s*${escapeRegExp(table)}\\s*\\]\\s*(#.*)?$`);

const keyLine = (key: string) => new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);

const isHeader = (line: string) => /^\s*\[/.test(line);

const valueOf = (line: string) =>
  line
    .slice(line.indexOf("=") + 1)
    .replace(/\s+#.*$/, "")
    .trim();

const sectionOf = (lines: string[], table: string) => {
  const start = lines.findIndex((line) => tableHeader(table).test(line));
  if (start < 0) return null;
  const next = lines.slice(start + 1).findIndex(isHeader);
  return { start, end: next < 0 ? lines.length : start + 1 + next };
};

const rootEnd = (lines: string[]) => {
  const first = lines.findIndex(isHeader);
  return first < 0 ? lines.length : first;
};

const hasInlineTable = (lines: string[], table: string) =>
  lines.slice(0, rootEnd(lines)).some((line) => new RegExp(`^\\s*${escapeRegExp(table)}\\s*=\\s*\\{`).test(line));

export const readTomlValue = (content: string, table: string, key: string) => {
  const lines = content.split("\n");
  const section = sectionOf(lines, table);
  if (section) {
    const line = lines.slice(section.start + 1, section.end).find((entry) => keyLine(key).test(entry));
    if (line) return valueOf(line);
  }
  const dotted = lines.slice(0, rootEnd(lines)).find((entry) => keyLine(`${table}.${key}`).test(entry));
  return dotted ? valueOf(dotted) : undefined;
};

export const setTomlValue = (content: string, table: string, key: string, value: string) => {
  const lines = content.split("\n");
  if (hasInlineTable(lines, table)) throw new Error(`${table} is an inline table; edit it by hand`);
  const assignment = `${key} = ${value}`;
  const dottedIndex = lines.slice(0, rootEnd(lines)).findIndex((entry) => keyLine(`${table}.${key}`).test(entry));
  if (dottedIndex >= 0) {
    lines[dottedIndex] = `${table}.${assignment}`;
    return lines.join("\n");
  }
  const section = sectionOf(lines, table);
  if (!section) {
    const base = content.replace(/\n*$/, "");
    return `${base}${base ? "\n\n" : ""}[${table}]\n${assignment}\n`;
  }
  const keyIndex = lines.slice(section.start + 1, section.end).findIndex((entry) => keyLine(key).test(entry));
  if (keyIndex >= 0) {
    lines[section.start + 1 + keyIndex] = assignment;
    return lines.join("\n");
  }
  lines.splice(section.start + 1, 0, assignment);
  return lines.join("\n");
};
