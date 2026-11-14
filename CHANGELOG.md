# Changelog

## v0.1.0

First public version.

- MCP gateway at `/v1/mcp`: `list_connections`, `search_tools`, `call_tool`, `execute`, `search_context`, `read_memory`, `write_memory`, `read_skill`, `read_skill_file`.
- Connections: remote MCP with OAuth, local MCP (stdio) and OpenAPI specs, encrypted at rest.
- Catalog with ~25 curated MCP servers, installed in one click.
- Organizations with their own connections, skills, memory and API keys (better-auth).
- Skills and memory with full-text search, `[[links]]`, versions and health checks.
- Context routing: short brief synced into `CLAUDE.md` and `AGENTS.md`, the rest on demand through MCP.
- CLI: `import`, `import-context` (Claude Code, Codex, Cursor, Grok, Gemini, OpenCode), `sync-context`, `install-clients`.
- Panel: overview, connectors, skills, memory, API keys and a guided setup.
- One-line install: `curl -fsSL https://github.com/Andsu-dev/runelay/releases/latest/download/install.sh | sh`.
- Secure by default: setup token for the first account, `execute` and local commands off, private URLs blocked, credentials hidden from agents, agents cannot pin memories.
- Docker image on `ghcr.io/andsu-dev/runelay` for `linux/amd64` and `linux/arm64`.
