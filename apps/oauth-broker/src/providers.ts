export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface BrokerSecrets {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export interface BrokerEnv extends BrokerSecrets {
  CALLBACK_RATE_LIMITER?: RateLimiter;
  TOKEN_RATE_LIMITER?: RateLimiter;
}

export interface BrokerProvider {
  tokenUrl: string;
  clientIdKey: keyof BrokerSecrets;
  clientSecretKey: keyof BrokerSecrets;
}

export const PROVIDERS = new Map<string, BrokerProvider>([
  [
    "google",
    {
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientIdKey: "GOOGLE_CLIENT_ID",
      clientSecretKey: "GOOGLE_CLIENT_SECRET",
    },
  ],
]);
