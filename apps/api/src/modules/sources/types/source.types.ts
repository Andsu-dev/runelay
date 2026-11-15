import type { OAuthClientInformationMixed, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { SourceConfig, SourceStatus, SourceView } from "@runelay/shared";
import type { OAuthBroker } from "@/modules/oauth/types/oauth.types";

export interface OAuthState {
  client?: OAuthClientInformationMixed;
  tokens?: OAuthTokens;
  verifier?: string;
  imported?: boolean;
  broker?: OAuthBroker;
}

export interface SourceKey {
  organizationId: string;
  name: string;
}

export interface Source extends SourceKey {
  config: SourceConfig;
  oauth: OAuthState;
  status: SourceStatus;
  error: string | null;
  toolCount: number;
  enabled: boolean;
  updatedAt: string;
}

export interface SourceRow extends Omit<Source, "config" | "oauth" | "enabled"> {
  config: string;
  oauth: string;
  enabled: 0 | 1;
}

export interface SourceViewRow extends Omit<SourceView, "config" | "enabled"> {
  config: string;
  enabled: 0 | 1;
}

export interface SourceStatusUpdate {
  status: SourceStatus;
  error: string | null;
  toolCount?: number;
}

export interface InstalledSourceRow {
  urlHash: string;
  name: string;
  status: SourceStatus;
}
