#!/bin/sh
set -eu

REPO="Andsu-dev/runelay"
VERSION="${RUNELAY_VERSION:-latest}"
INSTALL_DIR="${RUNELAY_INSTALL_DIR:-$HOME/.runelay/bin}"

say() { printf '\033[1m%s\033[0m\n' "$1"; }
fail() { printf 'runelay: %s\n' "$1" >&2; exit 1; }

case "$(uname -s)" in
  Darwin) OS="darwin" ;;
  Linux) OS="linux" ;;
  *) fail "Sistema não suportado: $(uname -s). Use macOS ou Linux." ;;
esac

case "$(uname -m)" in
  arm64 | aarch64) ARCH="arm64" ;;
  x86_64 | amd64) ARCH="x64" ;;
  *) fail "Arquitetura não suportada: $(uname -m)." ;;
esac

if [ "$OS" = "darwin" ] && [ "$ARCH" = "x64" ] && [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)" = "1" ]; then
  ARCH="arm64"
fi

ASSET="runelay-$OS-$ARCH"
if [ "$VERSION" = "latest" ]; then
  URL="https://github.com/$REPO/releases/latest/download/$ASSET"
else
  URL="https://github.com/$REPO/releases/download/$VERSION/$ASSET"
fi

command -v curl >/dev/null 2>&1 || fail "curl não encontrado."

say "Baixando $ASSET ($VERSION)"
mkdir -p "$INSTALL_DIR"
TMP_FILE="$INSTALL_DIR/runelay.download"
curl -fSL --progress-bar "$URL" -o "$TMP_FILE" || { rm -f "$TMP_FILE"; fail "Não consegui baixar $URL"; }
chmod +x "$TMP_FILE"
mv "$TMP_FILE" "$INSTALL_DIR/runelay"

case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *)
    case "$(basename "${SHELL:-sh}")" in
      zsh) RC="$HOME/.zshrc"; LINE="export PATH=\"$INSTALL_DIR:\$PATH\"" ;;
      bash)
        if [ -f "$HOME/.bashrc" ]; then RC="$HOME/.bashrc"; else RC="$HOME/.bash_profile"; fi
        LINE="export PATH=\"$INSTALL_DIR:\$PATH\""
        ;;
      fish) RC="$HOME/.config/fish/config.fish"; LINE="fish_add_path $INSTALL_DIR" ;;
      *) RC="$HOME/.profile"; LINE="export PATH=\"$INSTALL_DIR:\$PATH\"" ;;
    esac
    mkdir -p "$(dirname "$RC")"
    if ! grep -qs "$INSTALL_DIR" "$RC"; then
      printf '\n# runelay\n%s\n' "$LINE" >> "$RC"
      say "Adicionei $INSTALL_DIR ao PATH em $RC. Abra um terminal novo ou rode: $LINE"
    fi
    ;;
esac

say "runelay instalado em $INSTALL_DIR/runelay"
say "Próximo passo: runelay login"
