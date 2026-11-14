import {
  type AuthUser,
  attempt,
  type CreateOrganizationInput,
  fail,
  type MeView,
  type OrganizationView,
  ok,
  type Result,
} from "@runelay/shared";
import { auth } from "@/modules/auth/lib/better-auth";
import { findMembership, listMemberships, slugTaken } from "@/modules/auth/repositories/membership.repository";

export { listMemberships as listOrganizations } from "@/modules/auth/repositories/membership.repository";

export const describeMe = (user: AuthUser, organizationId: string): Result<MeView> => {
  const organizations = listMemberships(user.id);
  if (organizations.error) return organizations;
  const organization = organizations.data.find((candidate) => candidate.id === organizationId);
  if (!organization) return fail("FORBIDDEN");
  return ok({ user, organization, organizations: organizations.data });
};

export const createOrganization = async (
  headers: Headers,
  userId: string,
  input: CreateOrganizationInput,
): Promise<Result<OrganizationView>> => {
  const taken = slugTaken(input.slug);
  if (taken.error) return taken;
  if (taken.data) return fail("ALREADY_EXISTS", `O endereço "${input.slug}" já está em uso.`);
  const created = await attempt(() => auth.api.createOrganization({ headers, body: input }), "STORAGE_FAILED");
  if (created.error) return created;
  if (!created.data) return fail("STORAGE_FAILED");
  const organization = findMembership(userId, created.data.id);
  if (organization.error) return organization;
  return organization.data ? ok(organization.data) : fail("STORAGE_FAILED");
};

export const switchOrganization = async (
  headers: Headers,
  user: AuthUser,
  organizationId: string,
): Promise<Result<MeView>> => {
  const membership = findMembership(user.id, organizationId);
  if (membership.error) return membership;
  if (!membership.data) return fail("FORBIDDEN");
  const switched = await attempt(
    () => auth.api.setActiveOrganization({ headers, body: { organizationId } }),
    "STORAGE_FAILED",
  );
  if (switched.error) return switched;
  return describeMe(user, organizationId);
};
