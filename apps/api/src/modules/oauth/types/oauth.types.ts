export type OAuthBrokerProvider = "google";

export interface OAuthBroker {
  provider: OAuthBrokerProvider;
  clientId: string;
  scopes: string[];
}

export interface BrokerState {
  r: string;
  s: string;
}
