import { timingSafeEqual } from "node:crypto";
import {
  type AgentApiKeyView,
  type AgentKeyCheckView,
  attempt,
  type CreatedApiKeyView,
  ok,
  type Result,
} from "@runelay/shared";
import {
  deleteApiKeyRow,
  findApiKeyIdsByName,
  findApiKeySecret,
  findApiKeyView,
  findOrganizationOwner,
  saveApiKeySecret,
} from "@/modules/api-keys/repositories/api-key.repository";
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

export const issueAgentApiKey = async (organizationId: string, name: string): Promise<Result<AgentApiKeyView>> => {
  const previous = findApiKeyIdsByName(organizationId, name);
  if (previous.error) return previous;
  const owner = findOrganizationOwner(organizationId);
  if (owner.error) return owner;
  const created = await createApiKey(organizationId, owner.data, name);
  if (created.error) return created;
  for (const id of previous.data) {
    const revoked = deleteApiKeyRow(organizationId, id);
    if (revoked.error && revoked.error.code !== "API_KEY_NOT_FOUND") {
      deleteApiKeyRow(organizationId, created.data.id);
      return revoked;
    }
  }
  return ok({ ...created.data, rotated: previous.data.length });
};

const sameKey = (expected: string, received: string) => {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const checkAgentApiKey = (organizationId: string, name: string, key: string): Result<AgentKeyCheckView> => {
  const ids = findApiKeyIdsByName(organizationId, name);
  if (ids.error) return ids;
  const valid = ids.data.some((id) => {
    const secret = findApiKeySecret(organizationId, id);
    return !secret.error && sameKey(secret.data.key, key);
  });
  return ok({ valid });
};
