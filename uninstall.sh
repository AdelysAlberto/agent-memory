#!/usr/bin/env bash

set -e

echo "🗑️ Desinstalando Cogni..."

HOME_DIR="$HOME"
BIN_PATH="$HOME_DIR/.local/bin/cogni"

if [ -f "$BIN_PATH" ]; then
    rm -f "$BIN_PATH"
    echo "  -> Binario eliminado de $BIN_PATH"
fi

echo "  -> Limpiando skills en arneses de IA..."
rm -rf "$HOME_DIR/.gemini/config/skills/cogni" "$HOME_DIR/.gemini/config/skills/agent-memory"
rm -rf "$HOME_DIR/.cursor/skills/cogni" "$HOME_DIR/.cursor/skills/agent-memory"
rm -rf "$HOME_DIR/.config/opencode/skills/cogni" "$HOME_DIR/.agents/skills/cogni"
rm -rf "$HOME_DIR/.copilot/skills/cogni"
rm -rf "$HOME_DIR/.hermes/skills/cogni"

echo ""
read -p "¿Deseas eliminar también las bases de datos de memoria en ~/.cogni? (s/N): " REMOVE_DB || true

if [[ "$REMOVE_DB" =~ ^[sSyY]$ ]]; then
    rm -rf "$HOME_DIR/.cogni"
    echo "  -> Base de datos global ~/.cogni eliminada."
fi

echo "✅ Desinstalación de Cogni completada."
