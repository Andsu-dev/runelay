import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { CONTEXT_END_MARKER, CONTEXT_START_MARKER, CONTEXT_TARGETS } from "@/constants/context.constants";
import { fetchBrief } from "@/services/runeley-api.service";

const withBlock = (current: string, markdown: string) => {
  const block = `${CONTEXT_START_MARKER}\n${markdown.trim()}\n${CONTEXT_END_MARKER}`;
  const start = current.indexOf(CONTEXT_START_MARKER);
  const end = current.indexOf(CONTEXT_END_MARKER, start);
  if (start >= 0 && end > start)
    return current.slice(0, start) + block + current.slice(end + CONTEXT_END_MARKER.length);
  return `${current}${current && !current.endsWith("\n") ? "\n" : ""}${current ? "\n" : ""}${block}\n`;
};

export const syncContextCommand = async () => {
  for (const [client, file] of Object.entries(CONTEXT_TARGETS) as [keyof typeof CONTEXT_TARGETS, string][]) {
    if (!existsSync(dirname(file))) {
      console.log(`${client}: pulei (${dirname(file)} não existe)`);
      continue;
    }
    const { data, error } = await fetchBrief(client);
    if (error) {
      console.error(`${client}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, withBlock(current, data.markdown));
    console.log(`${client}: ${file} (${data.markdown.length} caracteres, ${data.pinnedCount} regras fixadas)`);
  }
};
