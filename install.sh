#!/usr/bin/env bash

set -e

echo "🧠 ========================================================"
echo "   [Cogni] Instalador Universal de Memoria para Agentes"
echo "   Cognitive Omniscient Grid for Networked Intelligence"
echo "========================================================"

HOME_DIR="$HOME"
TARGET_DIR="$HOME_DIR/.cogni"
BIN_INSTALL_DIR="$HOME_DIR/.local/bin"

mkdir -p "$TARGET_DIR"
mkdir -p "$BIN_INSTALL_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Compilación / Instalación del binario Go
if command -v go &> /dev/null; then
    echo "🔨 Compilando binario de Cogni en Go..."
    cd "$SCRIPT_DIR"
    go build -ldflags="-s -w" -o "$BIN_INSTALL_DIR/cogni" ./cmd/cogni
    chmod +x "$BIN_INSTALL_DIR/cogni"
    echo "✅ Binario instalado en $BIN_INSTALL_DIR/cogni"
elif [ -f "$SCRIPT_DIR/bin/cogni" ]; then
    echo "📦 Copiando binario precompilado..."
    cp "$SCRIPT_DIR/bin/cogni" "$BIN_INSTALL_DIR/cogni"
    chmod +x "$BIN_INSTALL_DIR/cogni"
else
    echo "❌ Error: Se requiere Go instalado para compilar o un binario precompilado."
    exit 1
fi

SKILL_SOURCE="$SCRIPT_DIR/SKILL.md"

echo ""
echo "🤖 Selecciona el entorno o Harness de IA que utilizas:"
echo "1) Gemini Antigravity (~/.gemini/config/skills/)"
echo "2) Cursor IDE (~/.cursor/skills/)"
echo "3) OpenCode (~/.config/opencode/skills/ & ~/.agents/skills/)"
echo "4) Agentes Estándar / Agentic CLI (~/.agents/skills/)"
echo "5) GitHub Copilot (~/.copilot/skills/)"
echo "6) Hermes CLI (~/.hermes/skills/)"
echo "7) Instalar en TODOS los entornos detectados (Recomendado)"
echo "8) Omitir instalación de Skill"
echo ""

HARNESS_CHOICE=""
if [ -t 0 ]; then
    read -p "Ingresa tu opción (1-8) [por defecto: 7]: " HARNESS_CHOICE || true
elif [ -r /dev/tty ]; then
    read -p "Ingresa tu opción (1-8) [por defecto: 7]: " HARNESS_CHOICE < /dev/tty 2>/dev/null || true
fi

if [ -z "$HARNESS_CHOICE" ]; then
    echo "ℹ️ Modo no interactivo detectado. Seleccionando opción 7 (TODOS los entornos por defecto)..."
    HARNESS_CHOICE=7
fi

install_antigravity() {
    GEMINI_SKILLS="$HOME_DIR/.gemini/config/skills"
    echo "  -> Instalando Skill en Gemini Antigravity: $GEMINI_SKILLS"
    mkdir -p "$GEMINI_SKILLS/cogni" "$GEMINI_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$GEMINI_SKILLS/cogni/SKILL.md"
    cp -f "$SKILL_SOURCE" "$GEMINI_SKILLS/agent-memory/SKILL.md"
}

install_cursor() {
    CURSOR_SKILLS="$HOME_DIR/.cursor/skills"
    echo "  -> Instalando Skill en Cursor IDE: $CURSOR_SKILLS"
    mkdir -p "$CURSOR_SKILLS/cogni"
    cp -f "$SKILL_SOURCE" "$CURSOR_SKILLS/cogni/SKILL.md"
}

install_opencode() {
    OPENCODE_SKILLS_1="$HOME_DIR/.config/opencode/skills"
    OPENCODE_SKILLS_2="$HOME_DIR/.agents/skills"
    echo "  -> Instalando Skill en OpenCode: $OPENCODE_SKILLS_1 y $OPENCODE_SKILLS_2"
    mkdir -p "$OPENCODE_SKILLS_1/cogni" "$OPENCODE_SKILLS_2/cogni"
    cp -f "$SKILL_SOURCE" "$OPENCODE_SKILLS_1/cogni/SKILL.md"
    cp -f "$SKILL_SOURCE" "$OPENCODE_SKILLS_2/cogni/SKILL.md"
}

install_agents_std() {
    STD_SKILLS="$HOME_DIR/.agents/skills"
    echo "  -> Instalando Skill en Agentes Estándar: $STD_SKILLS"
    mkdir -p "$STD_SKILLS/cogni"
    cp -f "$SKILL_SOURCE" "$STD_SKILLS/cogni/SKILL.md"
}

install_copilot() {
    COPILOT_SKILLS="$HOME_DIR/.copilot/skills"
    echo "  -> Instalando Skill en GitHub Copilot: $COPILOT_SKILLS"
    mkdir -p "$COPILOT_SKILLS/cogni"
    cp -f "$SKILL_SOURCE" "$COPILOT_SKILLS/cogni/SKILL.md"
}

install_hermes() {
    HERMES_SKILLS="$HOME_DIR/.hermes/skills"
    echo "  -> Instalando Skill en Hermes CLI: $HERMES_SKILLS"
    mkdir -p "$HERMES_SKILLS/cogni"
    cp -f "$SKILL_SOURCE" "$HERMES_SKILLS/cogni/SKILL.md"
}

case $HARNESS_CHOICE in
    1) install_antigravity ;;
    2) install_cursor ;;
    3) install_opencode ;;
    4) install_agents_std ;;
    5) install_copilot ;;
    6) install_hermes ;;
    7|*) 
        echo "🚀 Registrando en todos los arneses de IA..."
        install_antigravity
        install_cursor
        install_opencode
        install_agents_std
        install_copilot
        install_hermes
        ;;
    8) echo "⏭️ Instalación de skill omitida." ;;
esac

# Inicializar base de datos global
echo ""
echo "🗄️ Inicializando almacenamiento SQLite de Cogni..."
"$BIN_INSTALL_DIR/cogni" init --global

echo ""
echo "✅ [Cogni] ¡Instalación completada con éxito!"
echo "💡 Ahora puedes ejecutar desde cualquier terminal:"
echo "   - cogni search --query \"...\""
echo "   - cogni save --title \"...\" --summary \"...\""
echo "   - cogni ui          (Abre el Dashboard visual en navegador)"
echo "   - cogni share       (Exporta memorias en Markdown)"
echo "   - cogni stats       (Métricas de tokens ahorrados)"
echo ""
