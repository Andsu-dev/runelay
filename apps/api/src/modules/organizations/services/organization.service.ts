import {
  type AuthUser,
  attempt,
  type CreateOrganizationInput,
  fail,
  type MeView,
  type OrganizationView,
  ok,
  type Result,
  type UpdateOrganizationInput,
} from "@runelay/shared";
import { auth } from "@/modules/auth/lib/better-auth";
import {
  deleteOrganizationRows,
  findMembership,
  listMemberships,
  listStrandedMembers,
  slugTaken,
  updateOrganizationRow,
} from "@/modules/auth/repositories/membership.repository";
import { disconnectSource } from "@/modules/connectors/services/connection.service";
import { listSources } from "@/modules/sources/repositories/source.repository";

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

export const updateOrganization = (
  userId: string,
  organizationId: string,
  input: UpdateOrganizationInput,
): Result<OrganizationView> => {
  const membership = findMembership(userId, organizationId);
  if (membership.error) return membership;
  if (!membership.data || membership.data.role === "member") return fail("FORBIDDEN");
  const updated = updateOrganizationRow(organizationId, input);
  if (updated.error) return updated;
  return ok({ ...membership.data, ...input });
};

export const removeOrganization = async (user: AuthUser, organizationId: string): Promise<Result<MeView>> => {
  const membership = findMembership(user.id, organizationId);
  if (membership.error) return membership;
  if (membership.data?.role !== "owner") return fail("FORBIDDEN");
  const stranded = listStrandedMembers(organizationId);
  if (stranded.error) return stranded;
  if (stranded.data.includes(user.id)) return fail("LAST_ORGANIZATION");
  if (stranded.data.length > 0) return fail("MEMBERS_WITHOUT_ORGANIZATION");
  const sources = listSources(organizationId);
  if (sources.error) return sources;
  await Promise.all(sources.data.map((source) => disconnectSource({ organizationId, name: source.name })));
  const deleted = deleteOrganizationRows(organizationId);
  if (deleted.error) return deleted;
  const remaining = listMemberships(user.id);
  if (remaining.error) return remaining;
  const next = remaining.data[0];
  return next ? describeMe(user, next.id) : fail("STORAGE_FAILED");
};
