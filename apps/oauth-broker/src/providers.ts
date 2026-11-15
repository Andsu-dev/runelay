export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface BrokerSecrets {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface BrokerEnv extends BrokerSecrets {
  CALLBACK_RATE_LIMITER?: RateLimiter;
  TOKEN_RATE_LIMITER?: RateLimiter;
}

export interface BrokerProvider {
  tokenUrl: string;
  clientIdKey: keyof BrokerSecrets;
  clientSecretKey: keyof BrokerSecrets;
  refreshParams: readonly string[];
}

export const PROVIDERS = new Map<string, BrokerProvider>([
  [
    "google",
    {
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientIdKey: "GOOGLE_CLIENT_ID",
      clientSecretKey: "GOOGLE_CLIENT_SECRET",
      refreshParams: ["scope"],
    },
  ],
  [
    "github",
    {
      tokenUrl: "https://github.com/login/oauth/access_token",
      clientIdKey: "GITHUB_CLIENT_ID",
      clientSecretKey: "GITHUB_CLIENT_SECRET",
      refreshParams: [],
    },
  ],
]);
