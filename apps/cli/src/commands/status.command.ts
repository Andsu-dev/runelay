import { ok, type Result } from "@runeley/shared";
import { CONFIG_FILE } from "@/constants/cli.constants";
import { bold, dim } from "@/lib/terminal";
import { resolveConnection } from "@/services/config.service";
import { fetchStatus } from "@/services/runeley-api.service";

export const statusCommand = async (): Promise<Result<null>> => {
  const connection = resolveConnection();
  if (connection.error) return connection;
  const status = await fetchStatus(connection.data);
  if (status.error) return status;
  const { organizationName, sources, memories, skills } = status.data;
  console.log(`${bold(organizationName)} em ${connection.data.url}`);
  console.log(`  ${sources} conexões, ${memories} memórias, ${skills} habilidades`);
  console.log(
    dim(connection.data.fromEnv ? "  credenciais vindas de RUNELEY_URL / RUNELEY_API_KEY" : `  ${CONFIG_FILE}`),
  );
  return ok(null);
};
