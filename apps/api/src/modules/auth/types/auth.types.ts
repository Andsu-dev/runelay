export type AuthMethod = "session" | "api_key";

export interface Principal {
  organizationId: string;
  userId: string | null;
  apiKeyId: string | null;
  authMethod: AuthMethod;
}
