import type { OAuthBrokerProvider } from "@/modules/oauth/types/oauth.types";

export const OAUTH_CALLBACK_PATH = "/v1/oauth/callback";

export const OAUTH_CLIENT_NAME = "runelay";

export const OAUTH_DONE_PATH = "/connectors";

export const GOOGLE_BROKER_CLIENT_ID = "725636211525-j02smeaju1ti2oh3oospev37m3l3o7jl.apps.googleusercontent.com";

export const GITHUB_BROKER_CLIENT_ID = "Ov23liw340PORVAxgqkO";

export const BROKER_TOKEN_URLS: Record<OAuthBrokerProvider, string> = {
  google: "https://oauth2.googleapis.com/token",
  github: "https://github.com/login/oauth/access_token",
};

export const BROKER_AUTHORIZATION_PARAMS: Record<OAuthBrokerProvider, Record<string, string>> = {
  google: { access_type: "offline", prompt: "consent" },
  github: {},
};

export const AUTHORIZATION_HOSTS_WITHOUT_RESOURCE = new Set(["accounts.google.com"]);

export const TOKEN_URLS_WITHOUT_RESOURCE = new Set([BROKER_TOKEN_URLS.google]);

export const AUTHORIZATION_PARAMS_BY_HOST: Record<string, Record<string, string>> = {
  "accounts.google.com": BROKER_AUTHORIZATION_PARAMS.google,
};
