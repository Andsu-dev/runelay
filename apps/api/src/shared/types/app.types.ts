import type { AuthUser, OrganizationRole } from "@runelay/shared";
import type { AuthMethod } from "@/modules/auth/types/auth.types";

export interface AppEnv {
  Variables: {
    organizationId: string;
    userId: string | null;
    apiKeyId: string | null;
    authMethod: AuthMethod;
    role: OrganizationRole | null;
  };
}

export interface AccountEnv {
  Variables: {
    user: AuthUser;
    userId: string;
    sessionOrganizationId: string | null;
  };
}

export interface SessionEnv {
  Variables: AccountEnv["Variables"] & {
    organizationId: string;
    apiKeyId: null;
    authMethod: "session";
    role: OrganizationRole | null;
  };
}
