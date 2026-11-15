import type { OAuthBrokerProvider } from "@/modules/oauth/types/oauth.types";

export const OAUTH_CALLBACK_PATH = "/v1/oauth/callback";

export const OAUTH_CLIENT_NAME = "runelay";

export const OAUTH_DONE_PATH = "/connectors";

export const GOOGLE_BROKER_CLIENT_ID = "725636211525-j02smeaju1ti2oh3oospev37m3l3o7jl.apps.googleusercontent.com";

export const BROKER_TOKEN_URLS: Record<OAuthBrokerProvider, string> = {
  google: "https://oauth2.googleapis.com/token",
};

export const BROKER_AUTHORIZATION_PARAMS: Record<OAuthBrokerProvider, Record<string, string>> = {
  google: { access_type: "offline", prompt: "consent" },
};
