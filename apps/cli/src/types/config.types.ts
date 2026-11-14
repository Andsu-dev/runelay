export interface StoredConfig {
  url: string;
  apiKey: string;
  organizationName: string;
}

export interface Connection {
  url: string;
  apiKey: string;
  fromEnv: boolean;
}
