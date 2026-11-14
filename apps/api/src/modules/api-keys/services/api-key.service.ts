import { attempt, type CreatedApiKeyView, ok, type Result } from "@runelay/shared";
import { findApiKeyView, saveApiKeySecret } from "@/modules/api-keys/repositories/api-key.repository";
import { auth } from "@/modules/auth/lib/better-auth";

export {
  deleteApiKeyRow as deleteApiKey,
  findApiKeySecret as revealApiKey,
  listApiKeyViews as listApiKeys,
} from "@/modules/api-keys/repositories/api-key.repository";
export { listKeyActivity } from "@/modules/api-keys/repositories/audit.repository";

export const createApiKey = async (
  organizationId: string,
  userId: string,
  name: string,
): Promise<Result<CreatedApiKeyView>> => {
  const created = await attempt(
    () => auth.api.createApiKey({ body: { name, organizationId, userId } }),
    "STORAGE_FAILED",
  );
  if (created.error) return created;
  const stored = saveApiKeySecret(organizationId, created.data.id, created.data.key);
  if (stored.error) return stored;
  const view = findApiKeyView(organizationId, created.data.id);
  if (view.error) return view;
  return ok({ ...view.data, key: created.data.key });
};
