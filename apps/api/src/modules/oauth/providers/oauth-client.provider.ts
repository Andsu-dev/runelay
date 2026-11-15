import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { env } from "@/config/env";
import {
  AUTHORIZATION_HOSTS_WITHOUT_RESOURCE,
  AUTHORIZATION_PARAMS_BY_HOST,
  OAUTH_CALLBACK_PATH,
  OAUTH_CLIENT_NAME,
  TOKEN_URLS_WITHOUT_RESOURCE,
} from "@/modules/oauth/constants/oauth.constants";
import {
  brokerAuthorizationUrl,
  brokerCallbackUrl,
  brokerFetch,
  encodeBrokerState,
} from "@/modules/oauth/utils/oauth-broker";
import { findSource, markConnected, updateOAuth } from "@/modules/sources/repositories/source.repository";
import type { OAuthState, SourceKey } from "@/modules/sources/types/source.types";

const redirectUrl = `${env.PUBLIC_URL}${OAUTH_CALLBACK_PATH}`;

const CLEARED_BY_SCOPE: Record<"all" | "client" | "tokens" | "verifier" | "discovery", Partial<OAuthState>> = {
  all: { client: undefined, tokens: undefined, verifier: undefined },
  client: { client: undefined },
  tokens: { tokens: undefined },
  verifier: { verifier: undefined },
  discovery: {},
};

const customClientInformation = (oauth: OAuthState | undefined) =>
  oauth?.customClient && {
    client_id: oauth.customClient.clientId,
    ...(oauth.customClient.clientSecret ? { client_secret: oauth.customClient.clientSecret } : {}),
  };

const withProviderParams = (url: URL, scopes: string[] | undefined) => {
  const rewritten = new URL(url);
  if (scopes?.length) rewritten.searchParams.set("scope", scopes.join(" "));
  for (const [name, value] of Object.entries(AUTHORIZATION_PARAMS_BY_HOST[url.hostname] ?? {})) {
    rewritten.searchParams.set(name, value);
  }
  if (AUTHORIZATION_HOSTS_WITHOUT_RESOURCE.has(url.hostname)) rewritten.searchParams.delete("resource");
  return rewritten;
};

const withoutResource = (init?: RequestInit): RequestInit | undefined => {
  if (!(init?.body instanceof URLSearchParams) && typeof init?.body !== "string") return init;
  const body = new URLSearchParams(init.body);
  body.delete("resource");
  return { ...init, body };
};

export const createOAuthFetch = (key: SourceKey): ReturnType<typeof brokerFetch> => {
  const send = brokerFetch(findSource(key).data?.oauth.broker);
  return (input, init) =>
    send(input, TOKEN_URLS_WITHOUT_RESOURCE.has(new URL(input).href) ? withoutResource(init) : init);
};

export const createOAuthProvider = (key: SourceKey, onRedirect?: (url: URL) => void): OAuthClientProvider => {
  const oauth = () => findSource(key).data?.oauth;
  const save = (patch: Partial<OAuthState>) => {
    updateOAuth(key, patch);
  };
  const broker = oauth()?.broker;
  const callbackUrl = broker ? brokerCallbackUrl(broker.provider) : redirectUrl;
  return {
    redirectUrl: callbackUrl,
    clientMetadata: {
      client_name: OAUTH_CLIENT_NAME,
      redirect_uris: [callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    state: () => (broker ? encodeBrokerState(key.name) : key.name),
    clientInformation: () =>
      broker ? { client_id: broker.clientId } : (customClientInformation(oauth()) ?? oauth()?.client),
    saveClientInformation: (client) => {
      if (!broker && !oauth()?.customClient) save({ client });
    },
    tokens: () => oauth()?.tokens,
    saveTokens: (tokens) => {
      const previous = oauth()?.tokens?.refresh_token;
      save({ tokens: tokens.refresh_token || !previous ? tokens : { ...tokens, refresh_token: previous } });
      markConnected(key);
    },
    redirectToAuthorization: (url) =>
      onRedirect?.(
        broker ? brokerAuthorizationUrl(url, broker) : withProviderParams(url, oauth()?.customClient?.scopes),
      ),
    saveCodeVerifier: (verifier) => save({ verifier }),
    codeVerifier: () => oauth()?.verifier ?? "",
    invalidateCredentials: (scope) => save(CLEARED_BY_SCOPE[scope]),
  };
};
