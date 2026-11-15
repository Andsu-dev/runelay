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

## Routes

| Route | What it does |
|---|---|
| `GET /health` | Returns `{ "ok": true }`. |
| `GET /:provider/callback` | Reads `state`, a base64url JSON `{ "r": "<instance callback URL>", "s": "<original state>" }`. `r` must be `https`, or `http` only for `localhost`, `127.0.0.1` and `[::1]`. Redirects (302) to `r` with `code` (or `error` and `error_description`) and `state=s`. A missing or invalid state returns a plain 400. |
| `POST /:provider/token` | Form encoded. Accepts `grant_type=authorization_code` or `refresh_token`. Adds the provider's `client_id` and `client_secret`, forces `redirect_uri` to `<broker origin>/:provider/callback` for codes, drops `resource`, and passes the provider's status and JSON body through. |

Providers live in `src/providers.ts`. Today only `google` exists; adding `github` is one more entry with its token URL and secret names.

## Deploy

```sh
cd apps/oauth-broker
bunx wrangler secret put GOOGLE_CLIENT_ID
bunx wrangler secret put GOOGLE_CLIENT_SECRET
bun run deploy
```

`wrangler.jsonc` binds the Worker to the custom domain `auth.runelay.com`. Change the `routes` entry to deploy it elsewhere. Run it locally with `bun run dev` (put the secrets in `.dev.vars`, never in the repo).

## Google Cloud setup

1. Create an OAuth client of type **Web application**.
2. Add the authorized redirect URI `https://auth.runelay.com/google/callback` (or your broker's origin).
3. Enable the Google Calendar API, Google Docs API and Google Sheets API in the same project.
4. On the OAuth consent screen, add the scopes runelay asks for: `calendar.events`, `calendar.calendarlist.readonly`, `documents` and `spreadsheets`.
5. Publish the app to **Production**. While it stays in Testing, Google expires refresh tokens after 7 days and users have to log in again.

## Running your own broker

If you would rather not depend on `auth.runelay.com`, deploy this Worker with your own Google app and point your instance at it:

```sh
RUNELAY_OAUTH_BROKER_URL=https://auth.example.com
RUNELAY_GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
```

The client ID is public; the client secret stays only in your broker's Worker secrets. Sources connected before the change keep the client ID they were created with, so reinstall them from the catalog after switching.
