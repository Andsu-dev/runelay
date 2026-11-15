export interface BrokerEnv {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export interface BrokerProvider {
  tokenUrl: string;
  clientIdKey: keyof BrokerEnv;
  clientSecretKey: keyof BrokerEnv;
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
