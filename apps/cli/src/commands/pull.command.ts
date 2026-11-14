import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ok, type Result } from "@runeley/shared";
import { CONTEXT_END_MARKER, CONTEXT_START_MARKER, CONTEXT_TARGETS } from "@/constants/context.constants";
import { bold, dim, red } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";
import { fetchBrief } from "@/services/runeley-api.service";
import { materializeSkills } from "@/services/skill-materializer.service";
import type { Connection } from "@/types/config.types";
import type { SkillPullOutcome } from "@/types/skill-pull.types";

const withBlock = (current: string, markdown: string) => {
  const block = `${CONTEXT_START_MARKER}\n${markdown.trim()}\n${CONTEXT_END_MARKER}`;
  const start = current.indexOf(CONTEXT_START_MARKER);
  const end = current.indexOf(CONTEXT_END_MARKER, start);
  if (start >= 0 && end > start)
    return current.slice(0, start) + block + current.slice(end + CONTEXT_END_MARKER.length);
  return `${current}${current && !current.endsWith("\n") ? "\n" : ""}${current ? "\n" : ""}${block}\n`;
};

const pullBriefs = async (connection: Connection) => {
  for (const [client, file] of Object.entries(CONTEXT_TARGETS) as [keyof typeof CONTEXT_TARGETS, string][]) {
    if (!existsSync(dirname(file))) {
      console.log(dim(`  ${client}: pulei (${dirname(file)} não existe)`));
      continue;
    }
    const { data, error } = await fetchBrief(connection, client);
    if (error) {
      console.error(red(`  ${client}: ${error.message}`));
      process.exitCode = 1;
      continue;
    }
    const current = existsSync(file) ? readFileSync(file, "utf8") : "";
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, withBlock(current, data.markdown));
    console.log(`  ${client}: ${file} (${data.markdown.length} caracteres, ${data.pinnedCount} regras fixadas)`);
  }
};

const OUTCOME_LABELS: Record<SkillPullOutcome, string> = {
  created: "novas",
  updated: "atualizadas",
  unchanged: "iguais",
  local: "já existiam localmente",
  failed: "falharam",
};

const pullSkills = async (connection: Connection) => {
  const pulled = await materializeSkills(connection);
  if (pulled.error) {
    console.error(red(`  habilidades: ${pulled.error.message}`));
    process.exitCode = 1;
    return;
  }
  const counts = new Map<SkillPullOutcome, number>();
  for (const result of pulled.data) counts.set(result.outcome, (counts.get(result.outcome) ?? 0) + 1);
  const summary = [...counts].map(([outcome, total]) => `${total} ${OUTCOME_LABELS[outcome]}`).join(", ");
  console.log(`  habilidades: ${summary || "nenhuma ativa no servidor"}`);
  for (const failed of pulled.data.filter((result) => result.outcome === "failed")) {
    console.error(red(`    ${failed.slug}: ${failed.message ?? "falhou"}`));
    process.exitCode = 1;
  }
};

export const pullCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  console.log(bold("Trazendo o contexto do runeley:"));
  await pullBriefs(connection.data);
  await pullSkills(connection.data);
  return ok(null);
};
