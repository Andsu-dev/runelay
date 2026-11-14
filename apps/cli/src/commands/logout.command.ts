import { ok, type Result } from "@runeley/shared";
import { dim, green } from "@/lib/terminal";
import { clearConfig, readStoredConfig } from "@/services/config.service";
import { revokeCurrentKey } from "@/services/runeley-api.service";

export const logoutCommand = async (): Promise<Result<null>> => {
  const stored = readStoredConfig();
  if (stored.error) return clearConfig();
  if (!stored.data) {
    console.log("Você já estava fora.");
    return ok(null);
  }
  const revoked = await revokeCurrentKey({ url: stored.data.url, apiKey: stored.data.apiKey, fromEnv: false });
  const cleared = clearConfig();
  if (cleared.error) return cleared;
  if (revoked.error) console.log(dim(`A chave não foi revogada no servidor: ${revoked.error.message}`));
  console.log(
    `${green("Saiu")} de ${stored.data.organizationName}. A chave deste computador ${revoked.error ? "continua no painel" : "foi revogada"}.`,
  );
  return ok(null);
};
