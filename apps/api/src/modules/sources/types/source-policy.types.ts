import type { OrganizationRole } from "@runelay/shared";
import type { AuthMethod } from "@/modules/auth/types/auth.types";

export interface SourceActor {
  authMethod: AuthMethod;
  role: OrganizationRole | null;
}
