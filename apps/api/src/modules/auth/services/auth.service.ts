import { type AuthUser, fail, ok, type Result } from "@runelay/shared";
import { auth } from "@/modules/auth/lib/better-auth";
import { findMembershipRole } from "@/modules/auth/repositories/membership.repository";
import type { Principal } from "@/modules/auth/types/auth.types";

const bearerOf = (headers: Headers) =>
  headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1]
    ?.trim();

export const hasBearer = (headers: Headers) => Boolean(bearerOf(headers));

export const principalFromApiKey = async (headers: Headers): Promise<Principal | null> => {
  const key = bearerOf(headers);
  if (!key) return null;
  const verified = await auth.api.verifyApiKey({ body: { key } }).catch(() => null);
  if (!verified?.valid || !verified.key) return null;
  return { organizationId: verified.key.referenceId, userId: null, apiKeyId: verified.key.id, authMethod: "api_key" };
};

export const sessionOf = async (
  headers: Headers,
): Promise<{ user: AuthUser; organizationId: string | null } | null> => {
  const session = await auth.api.getSession({ headers }).catch(() => null);
  if (!session) return null;
  const { id, email, name, image } = session.user;
  return {
    user: { id, email, name, image: image ?? null },
    organizationId: session.session.activeOrganizationId ?? null,
  };
};

export const activeOrganizationOf = (userId: string, organizationId: string | null): Result<string> => {
  if (!organizationId) return fail("ORGANIZATION_REQUIRED");
  const role = findMembershipRole(userId, organizationId);
  if (role.error) return role;
  return role.data ? ok(organizationId) : fail("FORBIDDEN");
};
