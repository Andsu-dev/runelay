# Changelog

## v0.3.1

### Overview

- Calls to memories, skills, context search, tool search and the connection list now count as activity, so the overview no longer stays on "Nenhuma chamada ainda" for agents that mostly read context.
- New charts: daily activity split into connectors and context, usage by type, top connectors with their logos, recent skills and recent memories, and a 30-day error strip.
- One tooltip per chart that follows the hovered bar or segment.
- KPI numbers roll into place when the page opens.

## v0.3.0

### Desktop app

- runelay as a desktop app for Mac (Apple silicon and Intel), Windows and Linux (AppImage, x64 and arm64). It runs the whole server on `127.0.0.1:4312`, no Docker needed, and opens the first-account screen on its own.
- The secret lives in the system keychain (Keychain, DPAPI or the Linux keyring) when one is available. Links to other sites open in the browser.
- Local MCP servers by command are on in the app, since it runs on your own machine.
- In the app, the update button opens the download page instead of the Docker command.

### Server

- The server compiles to a single binary with the QuickJS sandbox embedded, so `execute` works outside Docker too.

### Site

- `bot.runelay.com/download` lists every platform with its download buttons and the latest version.

## v0.2.2

- A small gap between the rail and the page when the side panel is collapsed.
- New releases show up in the panel within 10 minutes instead of an hour.

## v0.2.1

- Connectors that sign in with a token (GitHub) ask for it in a dialog, on install and on the installed card, instead of opening a browser login that cannot work.
- After a browser login, the login tab tells the panel it is done and closes itself, and the panel refreshes on its own.
- A repeated OAuth callback no longer wipes the tokens of a connection that just connected, and no longer shows a stale "login failed" next to a green connection.
- A provider that only lets approved apps sign in now gets a clear message instead of a raw 403. Figma and Intercom left the catalog for that reason.
- The catalog refreshes connection status after an install.

## v0.2.0

### Panel

- Update button in the rail when a new release is out, with the release notes and a confirmation before updating. The page reloads by itself on the new version.
- Current version shown in the account menu.
- Hide the names of memories and skills with one click, with an animated mask.

### Server

- One-click update for owners and admins through an optional `updater` service (Watchtower) in `compose.yaml`. The installer generates `RUNELAY_UPDATER_TOKEN`.
- `GET /v1/system/version` reports the current and latest release, checked against GitHub at most once an hour.

## v0.1.2

- The project lives at `github.com/Andsu-dev/runelay` again, and the Docker image is back at the public `ghcr.io/andsu-dev/runelay`.
- The `execute` sandbox releases its host handles when setup fails before the code runs.
- CI with tests on every pull request, Dependabot and community health files.
- Includes everything from v0.1.1: first-access setup screen and the guided setup as the first screen after signing in.

## v0.1.1

- First access: a fresh server opens a "Configurar este runelay" screen that asks for the setup token (or the whole link) instead of a plain sign-in.
- After signing in, the guided setup is the first screen until it is complete.
- Docker image and links now live under the `runelay` GitHub organization: `ghcr.io/andsu-dev/runelay`.
- Short install URLs: `curl -fsSL bot.runelay.com/install | sh` and `curl -fsSL bot.runelay.com/cli | sh`.

## v0.1.0

First public version of runelay: one MCP endpoint for every account, skill and memory your agents use. Open source and self-hosted.

### Install

```sh
# server, on any machine with Docker
curl -fsSL https://github.com/Andsu-dev/runelay/releases/latest/download/install.sh | sh

# CLI, on your computer
curl -fsSL https://github.com/Andsu-dev/runelay/releases/latest/download/install-cli.sh | sh
runelay migrate
```

### Gateway

- MCP endpoint at `/v1/mcp` with nine tools: `list_connections`, `search_tools`, `call_tool`, `execute`, `search_context`, `read_memory`, `write_memory`, `read_skill`, `read_skill_file`.
- `execute` chains tools in JavaScript inside a QuickJS WebAssembly sandbox: fresh per run, no filesystem, network, process or timers, 32 MB of memory and CPU and wall-clock limits.
- Connections: remote MCP with OAuth (dynamic client registration and PKCE), local MCP by command, and OpenAPI specs turned into tools.
- Catalog with ~25 curated MCP servers (Linear, GitHub, Notion, Figma, Vercel, Supabase, Sentry, Stripe and more), installed in one click.

### Context

- Skills (`SKILL.md` with files) and memory (`[[linked]]` notes) per organization, with full-text search, versions, backlinks and a health report (stale, broken links, isolated).
- Context routing: a short brief (pinned rules and an index) synced into `CLAUDE.md` and `AGENTS.md`, the rest fetched on demand through MCP. Agents write new facts back with `write_memory`.

### CLI

- `runelay login` finds your server (`~/runelay/.env` or `localhost:4312`) or asks for the URL, then authorizes in the browser with a code. No keys to paste.
- `runelay migrate` brings MCP servers, memories, skills and instructions from Claude Code, Codex, Cursor, Grok, Gemini and OpenCode in one command. Accounts already logged in on the machine (Grok, Codex and Claude Code credentials) arrive connected; the rest go to a reconnect queue in the panel.
- `status`, `push`, `pull` (brief plus skills materialized into each agent's folder), `sync`, `connect` (registers runelay in every client), `import` and `logout`.
- Single binaries for macOS (arm64, x64) and Linux (x64, arm64).

### Panel

- Organizations with their own connections, skills, memory and API keys.
- Overview with call metrics, connectors catalog and installed list, skills, memory, API keys with a per-key activity timeline, guided setup with a progress timeline, and a reconnect queue that walks through every pending login.
- Monochrome interface with light and dark themes, motion and optional 8-bit sound feedback.

### Security

- First account requires a one-time setup token (printed by the installer and in the server log); signups close afterwards.
- Connection configs, OAuth tokens and recoverable API keys encrypted with AES-256-GCM.
- Agents never see credentials: API key requests and `list_connections` get headers and env values hidden.
- Agents cannot pin memories, so a prompt-injected agent cannot plant instructions for every other agent.
- Local commands are off by default (`RUNELAY_ENABLE_STDIO`) and, when on, only owners and admins can create them, with a minimal environment.
- Private, loopback, link-local and tailnet addresses blocked on every outgoing request and redirect (SSRF and DNS rebinding).
- Rate limit per API key and an audit log of every request a key makes.
- Docker image runs as an unprivileged user with read-only application code.

### Distribution

- Docker image `ghcr.io/andsu-dev/runelay` for `linux/amd64` and `linux/arm64`.
- `install.sh` for the server and `install-cli.sh` for the CLI attached to every release.
