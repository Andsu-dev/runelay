import { attemptSync } from "@runelay/shared";
import { env } from "@/config/env";
import {
  BROKER_AUTHORIZATION_PARAMS,
  BROKER_TOKEN_URLS,
  OAUTH_CALLBACK_PATH,
} from "@/modules/oauth/constants/oauth.constants";
import type { BrokerState, OAuthBroker } from "@/modules/oauth/types/oauth.types";
import { guardedFetch } from "@/modules/sources/utils/guarded-fetch";

export const brokerCallbackUrl = (broker: OAuthBroker) => `${env.RUNELAY_OAUTH_BROKER_URL}/${broker.provider}/callback`;

export const encodeBrokerState = (state: string) =>
  Buffer.from(JSON.stringify({ r: `${env.PUBLIC_URL}${OAUTH_CALLBACK_PATH}`, s: state })).toString("base64url");

export const decodeOAuthState = (state: string) => {
  const parsed = attemptSync(
    () => JSON.parse(Buffer.from(state, "base64url").toString()) as Partial<BrokerState> | null,
    "OAUTH_FAILED",
  );
  return typeof parsed.data?.s === "string" ? parsed.data.s : state;
};

export const brokerAuthorizationUrl = (url: URL, broker: OAuthBroker) => {
  const rewritten = new URL(url);
  rewritten.searchParams.set("scope", broker.scopes.join(" "));
  for (const [name, value] of Object.entries(BROKER_AUTHORIZATION_PARAMS[broker.provider])) {
    rewritten.searchParams.set(name, value);
  }
  rewritten.searchParams.delete("resource");
  return rewritten;
};

export const brokerFetch =
  (broker: OAuthBroker | undefined): typeof guardedFetch =>
  (input, init) => {
    const brokered = broker && new URL(input).href === BROKER_TOKEN_URLS[broker.provider];
    return guardedFetch(brokered ? `${env.RUNELAY_OAUTH_BROKER_URL}/${broker.provider}/token` : input, init);
  };
