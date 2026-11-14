export type CliAuthRowStatus = "pending" | "approved" | "consumed";

export interface NewCliAuthRequest {
  code: string;
  pollTokenHash: string;
  device: string;
  expiresAt: string;
}

export interface PendingCliAuthRow {
  code: string;
  device: string;
  expiresAt: string;
}

export interface ConsumedCliAuthRow {
  sealedKey: string;
  organizationName: string;
}
