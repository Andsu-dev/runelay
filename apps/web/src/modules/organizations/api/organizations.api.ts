import type { CreateOrganizationInput, MeView, OrganizationView, SetActiveOrganizationInput } from "@runelay/shared";
import { api } from "@/lib/api-client";

export const createOrganization = (input: CreateOrganizationInput) =>
  api.post<OrganizationView>("/organizations", input);

export const setActiveOrganization = (input: SetActiveOrganizationInput) =>
  api.post<MeView>("/organizations/active", input);
