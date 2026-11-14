import { ok, type Result } from "@runelay/shared";
import { bold } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";
import { collectContext } from "@/services/context-collector.service";
import { pushContext } from "@/services/context-push.service";
import type { CollectLine } from "@/types/collect.types";

const describeLine = ({ agent, kind, added, found, path }: CollectLine) => {
  if (kind === "instructions") return `  instruções do ${agent} em ${path}`;
  const label = kind === "memories" ? "memórias" : "skills   ";
  return `  ${label} ${String(added).padStart(4)} novas de ${found} no ${agent} (${path})`;
};

export const pushCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  console.log(bold("Lendo os agentes instalados:"));
  const { memories, skills, lines } = collectContext();
  for (const line of lines) console.log(describeLine(line));
  const pinned = memories.filter((memory) => memory.pinned).length;
  console.log(`\nTotal: ${memories.length} memórias (${pinned} fixadas) e ${skills.length} habilidades.`);
  const pushed = await pushContext(connection.data, memories, skills);
  if (pushed.error) return pushed;
  console.log(`Enviadas ${pushed.data.memories} memórias e ${pushed.data.skills} habilidades.`);
  return ok(null);
};
