export interface LocalCredential {
  agent: string;
  serverName: string;
  url: string;
  clientId: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
  tokenType?: string;
}

export interface CredentialScan {
  credentials: LocalCredential[];
  notes: string[];
  verboseNotes: string[];
}

export interface KeychainPlan {
  codexAccounts: string[];
  claude: boolean;
  prompts: number;
}
