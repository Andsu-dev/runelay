# runelay OAuth broker

A tiny Cloudflare Worker that lets self-hosted runelay instances connect Google's remote MCP servers (Calendar, Docs, Sheets) with one click.

## Why it exists

runelay is self-hosted, so every install has its own `PUBLIC_URL`. Google's authorization server (`https://accounts.google.com/`) has no dynamic client registration, and a Google OAuth client only accepts redirect URIs registered ahead of time. One Google app cannot list every instance's callback URL.

The broker gives the Google app a single redirect URI (`https://auth.runelay.com/google/callback`) and holds the client secret, so instances never need one:

1. The instance sends the user to Google with `redirect_uri=https://auth.runelay.com/google/callback` and a `state` that carries its own callback URL.
2. Google redirects to the broker, which bounces the `code` to the instance callback.
3. The instance exchanges the code (and later refreshes tokens) through `POST /google/token`. The broker adds `client_id` and `client_secret` and forwards the request to Google.

PKCE stays end to end: the `code_verifier` lives only on the instance and is forwarded untouched, so a code intercepted on the way is useless.

## Stateless guarantee

The broker has no storage, no KV, no database and no logs. It never writes tokens, codes or request bodies anywhere. Each request is handled and forgotten. Token responses go back to the instance with `Cache-Control: no-store`.

## Security model

The broker holds runelay's Google client secret, and anyone can build a Google authorization URL with runelay's public client ID. These rules keep that from turning into a way to steal other people's Google access.

### Confirmation page against consent phishing

Without a check, an attacker could build a Google login with runelay's client ID, the broker callback, a PKCE challenge of their own and `r` pointing at their server. The victim would see Google's genuine "runelay wants access" screen, approve it, and the broker would forward the code to the attacker, who would then redeem it through `POST /google/token` (where the broker adds the secret). PKCE does not help, because the attacker started the flow and holds the verifier.

So, before the code leaves the broker for a remote host, the user sees a page that names the destination: "This login is going to **runelay.example.com**. Is this your runelay?", with the full origin in monospace. The code only travels after a click on **Continue**, which posts a form back to the broker; there is no query flag that skips the page. **Cancel** shows "Login cancelled. You can close this tab." and sends nothing to the untrusted host. Internationalized hosts appear in punycode (`xn--…`) so look-alike domains stand out. The page is in Portuguese when the browser prefers it, English otherwise.

The page ships with `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self' <target origin>; frame-ancestors 'none'; base-uri 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`, so it cannot be framed (no clickjacking of the Continue button), runs no script and loads nothing external. `form-action` lists the target origin because Chrome applies it to the redirect that follows the form post. Every interpolated value is HTML escaped.

Loopback instances (`localhost`, `127.0.0.1`, `[::1]`) skip the page: the code goes back to the machine the browser runs on, never to a third party.

### Return URL rules

`r` in the state must be `https:` (or `http:` on loopback), have the path exactly `/v1/oauth/callback`, and carry no username, password, query string or fragment. A state longer than 2048 characters is rejected. This also stops the callback from being used as a generic open redirector.

### Token endpoint

- Only `application/x-www-form-urlencoded` bodies are accepted (415 otherwise), up to 8 KB (413 otherwise; the callback form post has the same limit).
- PKCE is mandatory: `authorization_code` needs `code` and `code_verifier`, and `refresh_token` needs `refresh_token`, or the broker answers 400 `invalid_request` without calling Google.
- Only an allowlist is forwarded: `grant_type`, `code`, `code_verifier`, `refresh_token`, and `scope` on refreshes, plus the broker's own `client_id`, `client_secret` and `redirect_uri`. Anything else the caller sends (`resource`, a spoofed `client_id`, `redirect_uri`, extra Google parameters) is dropped.

### Rate limits

Two [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) bindings in `wrangler.jsonc`, keyed by route and `cf-connecting-ip`: `CALLBACK_RATE_LIMITER` allows 30 requests a minute per IP on the callback (GET and POST), and `TOKEN_RATE_LIMITER` 60 a minute on the token endpoint. Over the limit the broker answers 429 with `Retry-After: 60` (`slow_down` as JSON on the token endpoint). The counters are per Cloudflare location and approximate, so they slow down abuse rather than enforce exact quotas. Without the bindings (tests, plain local runs) nothing is limited, and if the binding errors the request goes through.

### No logs

`wrangler.jsonc` turns off Workers Logs (`observability.enabled: false`, `head_sampling_rate: 0`, `logs.invocation_logs: false`), Logpush and preview URLs, so callback URLs with codes are never stored by Cloudflare. `wrangler tail` still streams live requests to whoever runs it, so only account owners should have access.

## Routes

| Route | What it does |
|---|---|
| `GET /health` | Returns `{ "ok": true }`. |
| `GET /:provider/callback` | Reads `state`, a base64url JSON `{ "r": "<instance callback URL>", "s": "<original state>" }`, checked against the return URL rules. Loopback instances get a 302 to `r` with `code` (or `error` and `error_description`) and `state=s`. Remote instances get the confirmation page. A missing or invalid state returns a plain 400. |
| `POST /:provider/callback` | The confirmation form. Re-validates `state`, then 302s to `r` exactly like the loopback case, or shows the cancelled page when the user picked Cancel. |
| `POST /:provider/token` | Form encoded. Accepts `grant_type=authorization_code` (with PKCE) or `refresh_token`. Forwards the allowlisted params with the provider's `client_id` and `client_secret`, forces `redirect_uri` to `<broker origin>/:provider/callback` for codes, and passes the provider's status and JSON body through. |

Wrong methods on these routes return 405 with an `Allow` header; any other path is 404.

Providers live in `src/providers.ts`. Today only `google` exists; adding `github` is one more entry with its token URL and secret names.

## Deploy

```sh
cd apps/oauth-broker
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bun run deploy
```

`wrangler.jsonc` binds the Worker to the custom domain `auth.runelay.com`. Change the `routes` entry to deploy it elsewhere. Run it locally with `bun run dev` (put the secrets in `.dev.vars`, never in the repo).

## Operations

- Turn on two-factor authentication for every Cloudflare and Google Cloud account that can reach this Worker or the OAuth client. Whoever controls either one controls the client secret.
- Rotate the client secret when someone with access leaves, or if it may have leaked:
  1. In Google Cloud, open the OAuth client and add a new client secret (the old one keeps working meanwhile).
  2. `cd apps/oauth-broker && bunx wrangler secret put GOOGLE_CLIENT_SECRET` and paste the new value. Wrangler deploys a new version with it right away.
  3. Check `https://auth.runelay.com/health` and finish one real Google login from a runelay instance, including a token refresh if you can.
  4. Delete the old secret in Google Cloud.
- The rate limit `namespace_id`s in `wrangler.jsonc` must be unique in the Cloudflare account; change them if another Worker already uses them.

## Google Cloud setup

1. Create an OAuth client of type **Web application**.
2. Add the authorized redirect URI `https://auth.runelay.com/google/callback` (or your broker's origin).
3. Enable the Google Calendar API, Google Docs API and Google Sheets API in the same project.
4. On the OAuth consent screen, add the scopes runelay asks for: `calendar`, `calendar.events`, `documents` and `spreadsheets`.
5. Publish the app to **Production**. While it stays in Testing, Google expires refresh tokens after 7 days and users have to log in again.

## Running your own broker

If you would rather not depend on `auth.runelay.com`, deploy this Worker with your own Google app and point your instance at it:

```sh
RUNELAY_OAUTH_BROKER_URL=https://auth.example.com
RUNELAY_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

The client ID is public; the client secret stays only in your broker's Worker secrets. Sources connected before the change keep the client ID they were created with, so reinstall them from the catalog after switching.
