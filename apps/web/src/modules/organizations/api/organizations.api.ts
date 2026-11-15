import type {
  CreateOrganizationInput,
  MeView,
  OrganizationView,
  SetActiveOrganizationInput,
  UpdateOrganizationInput,
} from "@runelay/shared";
import { api } from "@/lib/api-client";

export const createOrganization = (input: CreateOrganizationInput) =>
  api.post<OrganizationView>("/organizations", input);

export const setActiveOrganization = (input: SetActiveOrganizationInput) =>
  api.post<MeView>("/organizations/active", input);

export const updateOrganization = (organizationId: string, input: UpdateOrganizationInput) =>
  api.patch<OrganizationView>(`/organizations/${organizationId}`, input);

export const deleteOrganization = (organizationId: string) => api.delete<MeView>(`/organizations/${organizationId}`);
