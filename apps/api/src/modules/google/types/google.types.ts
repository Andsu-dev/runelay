import type { Result } from "@runelay/shared";
import type { z } from "zod";

export interface GoogleOAuthState {
  scopes: string[];
  expiresAt?: number;
  email?: string;
  name?: string;
}

export interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleRequest {
  url: string;
  method?: string;
  query?: Record<string, string | number | boolean | undefined>;
  json?: unknown;
  body?: string;
  contentType?: string;
}

export type GoogleApi = <T = Record<string, unknown>>(request: GoogleRequest) => Promise<Result<T>>;

export type GoogleFetch = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface GoogleToolDefinition<Schema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  input: Schema;
  run: (api: GoogleApi, input: z.infer<Schema>) => Promise<Result<unknown>>;
}
