#!/usr/bin/env bash

set -e

echo "🧠 ========================================================"
echo "   [agents-memory] Desinstalador de Memoria Agentica"
echo "========================================================"

HOME_DIR="$HOME"
TARGET_DIR="$HOME_DIR/.agent-memory"

echo "🗑️ Eliminando habilidades (SKILL.md) de todos los arneses de IA..."

rm -rf "$HOME_DIR/.gemini/config/skills/agent-memory"
rm -rf "$HOME_DIR/.cursor/skills/agent-memory"
rm -rf "$HOME_DIR/.config/opencode/skills/agent-memory"
rm -rf "$HOME_DIR/.agents/skills/agent-memory"
rm -rf "$HOME_DIR/.copilot/skills/agent-memory"
rm -rf "$HOME_DIR/.hermes/skills/agent-memory"

echo "🔗 Desvinculando comando binario global 'agent-memory'..."
npm unlink --quiet 2>/dev/null || npm unlink --location=global --quiet 2>/dev/null || true

if [ -d "$TARGET_DIR" ]; then
    if [ "$1" = "--purge" ]; then
        rm -rf "$TARGET_DIR"
        echo "🧹 Base de datos y datos globales eliminados ($TARGET_DIR)."
    else
        echo "ℹ️ Se conserva la base de datos en $TARGET_DIR (usa 'uninstall.sh --purge' para eliminarla)."
    fi
fi

echo ""
echo "✅ ¡agent-memory ha sido desinstalado con éxito!"
