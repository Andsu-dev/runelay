const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const indentOf = (line: string) => line.length - line.trimStart().length;

const isChildLine = (line: string) => !line.trim() || line.trimStart().startsWith("#") || indentOf(line) > 0;

const sectionOf = (lines: string[], section: string) => {
  const start = lines.findIndex((line) => new RegExp(`^${escapeRegExp(section)}:\\s*(#.*)?$`).test(line));
  if (start < 0) return null;
  let end = start + 1;
  while (end < lines.length && isChildLine(lines[end] ?? "")) end += 1;
  const firstChild = lines.slice(start + 1, end).find((line) => line.trim() && !line.trimStart().startsWith("#"));
  return { start, end, indent: firstChild ? indentOf(firstChild) : 2 };
};

const childKey = (indent: number, key: string) => new RegExp(`^ {${indent}}${escapeRegExp(key)}:(\\s|$)`);

const assertBlockSection = (lines: string[], section: string) => {
  if (lines.some((line) => new RegExp(`^${escapeRegExp(section)}:\\s*[^\\s#]`).test(line)))
    throw new Error(`${section} is not in block style; edit it by hand`);
};

export const readYamlValue = (content: string, section: string, key: string) => {
  const lines = content.split("\n");
  const found = sectionOf(lines, section);
  if (!found) return undefined;
  const line = lines.slice(found.start + 1, found.end).find((entry) => childKey(found.indent, key).test(entry));
  return line
    ?.slice(line.indexOf(":") + 1)
    .replace(/\s+#.*$/, "")
    .trim();
};

export const setYamlValue = (content: string, section: string, key: string, value: string) => {
  const lines = content.split("\n");
  assertBlockSection(lines, section);
  const found = sectionOf(lines, section);
  if (!found) {
    const base = content.replace(/\n*$/, "");
    return `${base}${base ? "\n" : ""}${section}:\n  ${key}: ${value}\n`;
  }
  const assignment = `${" ".repeat(found.indent)}${key}: ${value}`;
  const index = lines.slice(found.start + 1, found.end).findIndex((entry) => childKey(found.indent, key).test(entry));
  if (index >= 0) lines[found.start + 1 + index] = assignment;
  else lines.splice(found.start + 1, 0, assignment);
  return lines.join("\n");
};

export type YamlNode = string | boolean | { [key: string]: YamlNode };

const renderYaml = (key: string, value: YamlNode, indent: number, step: number): string[] =>
  typeof value !== "object"
    ? [`${" ".repeat(indent)}${key}: ${JSON.stringify(value)}`]
    : [
        `${" ".repeat(indent)}${key}:`,
        ...Object.entries(value).flatMap(([child, node]) => renderYaml(child, node, indent + step, step)),
      ];

const childIndex = (lines: string[], found: { start: number; end: number; indent: number }, key: string) =>
  lines.findIndex((line, index) => index > found.start && index < found.end && childKey(found.indent, key).test(line));

const childBlockEnd = (lines: string[], from: number, end: number, indent: number) => {
  let last = from;
  for (let index = from + 1; index < end; index += 1) {
    const line = lines[index] ?? "";
    if (!line.trim()) continue;
    if (indentOf(line) <= indent) break;
    last = index;
  }
  return last + 1;
};

export const readYamlBlock = (content: string, section: string, key: string) => {
  const lines = content.split("\n");
  const found = sectionOf(lines, section);
  if (!found) return undefined;
  const index = childIndex(lines, found, key);
  if (index < 0) return undefined;
  return lines.slice(index, childBlockEnd(lines, index, found.end, found.indent)).join("\n");
};

export const setYamlBlock = (content: string, section: string, key: string, value: YamlNode) => {
  const lines = content.split("\n");
  assertBlockSection(lines, section);
  const found = sectionOf(lines, section);
  if (!found) {
    const base = content.replace(/\n*$/, "");
    return `${base}${base ? "\n" : ""}${[`${section}:`, ...renderYaml(key, value, 2, 2)].join("\n")}\n`;
  }
  const block = renderYaml(key, value, found.indent, found.indent);
  const index = childIndex(lines, found, key);
  if (index >= 0) {
    lines.splice(index, childBlockEnd(lines, index, found.end, found.indent) - index, ...block);
    return lines.join("\n");
  }
  let insertAt = found.start + 1;
  for (let line = found.start + 1; line < found.end; line += 1) {
    const text = lines[line] ?? "";
    if (text.trim() && !text.trimStart().startsWith("#")) insertAt = line + 1;
  }
  lines.splice(insertAt, 0, ...block);
  return lines.join("\n");
};
