import type { OrganizationRole } from "@runeley/shared";
import type { AuthMethod } from "@/modules/auth/types/auth.types";

export interface SourceActor {
  authMethod: AuthMethod;
  role: OrganizationRole | null;
}
