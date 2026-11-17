import { ok, type Result } from "@runelay/shared";
import { bold, dim, mark } from "@/lib/terminal";
import { clearConfig, readStoredConfig } from "@/services/config.service";
import { revokeCurrentKey } from "@/services/runelay-api.service";

export const logoutCommand = async (): Promise<Result<null>> => {
  const stored = readStoredConfig();
  if (stored.error) return clearConfig();
  if (!stored.data) {
    console.log(`${mark.meta} You were already signed out.`);
    return ok(null);
  }
  const revoked = await revokeCurrentKey({ url: stored.data.url, apiKey: stored.data.apiKey, fromEnv: false });
  const cleared = clearConfig();
  if (cleared.error) return cleared;
  if (revoked.error) console.log(dim(`  The key wasn't revoked on the server: ${revoked.error.message}`));
  console.log(
    `${mark.ok} Signed out of ${bold(stored.data.organizationName)}. This computer's key ${revoked.error ? "is still in the dashboard" : "was revoked"}.`,
  );
  return ok(null);
};
