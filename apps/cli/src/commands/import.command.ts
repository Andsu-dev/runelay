import { existsSync, readFileSync } from "node:fs";
import type { CreateSourceInput } from "@runeley/shared";
import { parseClientConfig } from "@runeley/shared/importers";
import { cliEnv } from "@/config";
import { CLIENT_CONFIG_FILES } from "@/constants/clients.constants";
import { pushSources } from "@/services/runeley-api.service";

export const importCommand = async () => {
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

  const { data, error } = await pushSources([...byName.values()]);
  if (error) {
    console.error(`Falhou: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Importadas ${data.imported.length}: ${data.imported.join(", ")}`);
  console.log(`Abra ${cliEnv.RUNELEY_URL} e faça login nas que ficaram "precisa reconectar".`);
};
