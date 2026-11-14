# Contributing

Thanks for helping with runelay.

## Setup

```sh
bun install
cp .env.example .env          # PUBLIC_URL=http://localhost:5173 for dev
bun run seed                  # demo user, organization, connections and an API key
bun run dev                   # API on :4312, panel on :5173
```

## Before opening a PR

```sh
bun run check       # biome format + lint
bun run typecheck
bun test
```

CI runs the same three steps on every pull request.

## Pull requests

- One change per PR. Open an issue first for anything large.
- Branch names: `feat/...`, `fix/...`, `refactor/...`, `chore/...`, `docs/...`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat(api): add tool approval policies`.
- Add a test when you fix a bug or add logic with branches.
- User-facing changes get a line in `CHANGELOG.md`.

## Security

Never open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
