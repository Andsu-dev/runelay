import { existsSync, readFileSync } from "node:fs";
import { type CreateSourceInput, ok, type Result } from "@runeley/shared";
import { parseClientConfig } from "@runeley/shared/importers";
import { CLIENT_CONFIG_FILES } from "@/constants/clients.constants";
import { resolveConnection } from "@/services/config.service";
import { pushSources } from "@/services/runeley-api.service";

export const importCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const byName = new Map<string, CreateSourceInput>();
  for (const [client, file] of Object.entries(CLIENT_CONFIG_FILES)) {
    if (!existsSync(file)) continue;
    const { data: found, error } = parseClientConfig(readFileSync(file, "utf8"), process.env);
    if (error) {
      console.log(`${client}: ${error.message}`);
      continue;
    }
    console.log(`${client}: ${found.map((source) => source.name).join(", ") || "nada"}`);
    for (const source of found) if (!byName.has(source.name)) byName.set(source.name, source);
  }

  const imported = await pushSources(connection.data, [...byName.values()]);
  if (imported.error) return imported;
  console.log(`Importadas ${imported.data.imported.length}: ${imported.data.imported.join(", ")}`);
  for (const { name, reason } of imported.data.skipped) console.log(`  pulada ${name}: ${reason}`);
  console.log(`Abra ${connection.data.url} e faça login nas que ficaram "precisa reconectar".`);
  return ok(null);
};
