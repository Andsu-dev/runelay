import type { z } from "zod";
import type { AuthUser } from "../auth/auth.types";
import type {
  createOrganizationSchema,
  setActiveOrganizationSchema,
  updateOrganizationSchema,
} from "./organization.schema";

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type SetActiveOrganizationInput = z.infer<typeof setActiveOrganizationSchema>;

export type OrganizationRole = "owner" | "admin" | "member";

export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  role: OrganizationRole;
}

export interface MeView {
  user: AuthUser;
  organization: OrganizationView;
  organizations: OrganizationView[];
}
