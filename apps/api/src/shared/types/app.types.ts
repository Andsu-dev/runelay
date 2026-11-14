import type { AuthUser } from "@runeley/shared";
import type { AuthMethod } from "@/modules/auth/types/auth.types";

export interface AppEnv {
  Variables: {
    organizationId: string;
    userId: string | null;
    apiKeyId: string | null;
    authMethod: AuthMethod;
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
  };
}
