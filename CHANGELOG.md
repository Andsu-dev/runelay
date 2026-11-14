# Changelog

## v0.1.1

- First access: a fresh server opens a "Configurar este runelay" screen that asks for the setup token (or the whole link) instead of a plain sign-in.
- After signing in, the guided setup is the first screen until it is complete.
- Docker image and links now live under the `runelay` GitHub organization: `ghcr.io/runelay/runelay`.
- Short install URLs: `curl -fsSL bot.runelay.com/install | sh` and `curl -fsSL bot.runelay.com/cli | sh`.
- README: running privately on a Tailscale tailnet.

## v0.1.0

First public version of runelay: one MCP endpoint for every account, skill and memory your agents use. Open source and self-hosted.

### Install

```sh
# server, on any machine with Docker
curl -fsSL https://github.com/runelay/runelay/releases/latest/download/install.sh | sh

# CLI, on your computer
curl -fsSL https://github.com/runelay/runelay/releases/latest/download/install-cli.sh | sh
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

- Docker image `ghcr.io/runelay/runelay` for `linux/amd64` and `linux/arm64`.
- `install.sh` for the server and `install-cli.sh` for the CLI attached to every release.
