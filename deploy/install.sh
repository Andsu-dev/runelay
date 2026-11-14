#!/bin/sh
set -eu

REPO="Andsu-dev/runeley"
INSTALL_DIR="${RUNELEY_DIR:-$HOME/runeley}"
VERSION="${RUNELEY_VERSION:-latest}"
PORT="${RUNELEY_PORT:-4312}"
PUBLIC_URL="${PUBLIC_URL:-http://localhost:$PORT}"

say() { printf '\033[1m%s\033[0m\n' "$1"; }
fail() { printf 'runeley: %s\n' "$1" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || fail "Docker não encontrado. Instale em https://docs.docker.com/get-docker/ e rode de novo."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 não encontrado (docker compose)."
docker info >/dev/null 2>&1 || fail "O Docker não está rodando."

say "Instalando runeley em $INSTALL_DIR"
mkdir -p "$INSTALL_DIR/data"
cd "$INSTALL_DIR"

if [ "$VERSION" = "latest" ]; then
  COMPOSE_URL="https://github.com/$REPO/releases/latest/download/compose.yaml"
else
  COMPOSE_URL="https://github.com/$REPO/releases/download/$VERSION/compose.yaml"
fi
curl -fsSL "$COMPOSE_URL" -o compose.yaml || fail "Não consegui baixar o compose.yaml de $COMPOSE_URL"

if [ ! -f .env ]; then
  random_hex() {
    if command -v openssl >/dev/null 2>&1; then openssl rand -hex "$1"
    else head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; fi
  }
  SECRET="$(random_hex 32)"
  SETUP_TOKEN="$(random_hex 18)"
  cat > .env <<ENV
PUBLIC_URL=$PUBLIC_URL
RUNELEY_SECRET=$SECRET
RUNELEY_SETUP_TOKEN=$SETUP_TOKEN
ALLOW_SIGNUP=false
RUNELEY_VERSION=$VERSION
RUNELEY_PORT=$PORT
ENV
  chmod 600 .env
  say "Criei o .env com um RUNELEY_SECRET novo. Guarde uma cópia: sem ele as conexões não abrem."
else
  say "Mantive o .env que já existia."
fi

docker compose pull
docker compose up -d

say ""
SETUP_TOKEN="$(grep '^RUNELEY_SETUP_TOKEN=' .env | cut -d= -f2-)"
say "runeley está no ar em $PUBLIC_URL"
if [ -n "$SETUP_TOKEN" ]; then
  say "Crie a conta dona por este link (só ele funciona no primeiro acesso):"
  say "$PUBLIC_URL/login?mode=signup&token=$SETUP_TOKEN"
else
  say "O link de primeiro acesso aparece em: cd $INSTALL_DIR && docker compose logs runeley"
fi
say "Atualizar: cd $INSTALL_DIR && docker compose pull && docker compose up -d"
