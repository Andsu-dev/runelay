import type { OAuthBrokerProvider } from "@/modules/oauth/types/oauth.types";

export const OAUTH_CALLBACK_PATH = "/v1/oauth/callback";

export const OAUTH_CLIENT_NAME = "runelay";

export const OAUTH_DONE_PATH = "/connectors";

export const GOOGLE_BROKER_CLIENT_ID = "runelay-placeholder.apps.googleusercontent.com";

export const BROKER_TOKEN_URLS: Record<OAuthBrokerProvider, string> = {
  google: "https://oauth2.googleapis.com/token",
};

export const BROKER_AUTHORIZATION_PARAMS: Record<OAuthBrokerProvider, Record<string, string>> = {
  google: { access_type: "offline", prompt: "consent" },
};

export const AUTHORIZATION_PARAMS_BY_HOST: Record<string, Record<string, string>> = {
  "accounts.google.com": BROKER_AUTHORIZATION_PARAMS.google,
};
