export type OAuthBrokerProvider = "google" | "github";

export interface OAuthBroker {
  provider: OAuthBrokerProvider;
  clientId: string;
  scopes: string[];
}

export interface BrokerState {
  r: string;
  s: string;
}
