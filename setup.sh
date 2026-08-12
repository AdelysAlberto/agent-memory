#!/usr/bin/env bash

set -e

echo "🧠 ========================================================"
echo "   [agents-memory] Instalador Universal de Memoria Agentica"
echo "========================================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado. Por favor instala Node.js >= 18."
    exit 1
fi

HOME_DIR="$HOME"
TARGET_DIR="$HOME_DIR/.agent-memory"

# Si se ejecuta mediante curl | sh desde cualquier directorio que no sea el repositorio clonado
if [ ! -f "package.json" ]; then
    echo "📥 Clonando / actualizando repositorio en $TARGET_DIR..."
    if [ -d "$TARGET_DIR/.git" ]; then
        git -C "$TARGET_DIR" pull --quiet
    else
        rm -rf "$TARGET_DIR"
        git clone --quiet https://github.com/AdelysAlberto/agent-memory.git "$TARGET_DIR"
    fi
    MEMORY_REPO_DIR="$TARGET_DIR"
else
    MEMORY_REPO_DIR="$(pwd)"
fi

cd "$MEMORY_REPO_DIR"
SKILL_SOURCE="$MEMORY_REPO_DIR/SKILL.md"

# Instalar dependencias si no existen
if [ ! -d "$MEMORY_REPO_DIR/node_modules" ]; then
    echo "📦 Instalando dependencias de npm..."
    npm install --quiet
fi

# Inicializar BD
echo "🗄️ Inicializando base de datos SQLite embebida..."
node "$MEMORY_REPO_DIR/scripts/memory-cli.js" init

# Permisos
chmod +x "$MEMORY_REPO_DIR/scripts/memory-cli.js"

echo ""
echo "🤖 Selecciona el entorno o Harness de IA que utilizas:"
echo "1) Gemini Antigravity (~/.gemini/config/skills/)"
echo "2) OpenCode (~/.config/opencode/skills/ & ~/.agents/skills/)"
echo "3) Agentes Estándar / Agentic CLI (~/.agents/skills/)"
echo "4) GitHub Copilot (~/.copilot/skills/)"
echo "5) Hermes CLI (~/.hermes/skills/)"
echo "6) Instalar en TODOS los entornos detectados"
echo "7) Omitir instalación de Skill"
echo ""

HARNESS_CHOICE=""
if [ -t 0 ]; then
    read -p "Ingresa tu opción (1-7) [por defecto: 6]: " HARNESS_CHOICE || true
else
    # Intento seguro sin que sh detenga la ejecución por 'set -e'
    HARNESS_CHOICE=$( (read -p "Ingresa tu opción (1-7) [por defecto: 6]: " choice < /dev/tty && echo "$choice") 2>/dev/null || echo "" )
fi

if [ -z "$HARNESS_CHOICE" ]; then
    echo "ℹ️ Modo no interactivo o pipe detectado. Seleccionando opción 6 (TODOS los entornos por defecto)..."
    HARNESS_CHOICE=6
fi

install_antigravity() {
    GEMINI_SKILLS="$HOME_DIR/.gemini/config/skills"
    echo "  -> Instalando Skill en Gemini Antigravity: $GEMINI_SKILLS"
    mkdir -p "$GEMINI_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$GEMINI_SKILLS/agent-memory/SKILL.md"
}

install_opencode() {
    OPENCODE_SKILLS_1="$HOME_DIR/.config/opencode/skills"
    OPENCODE_SKILLS_2="$HOME_DIR/.agents/skills"
    echo "  -> Instalando Skill en OpenCode: $OPENCODE_SKILLS_1 y $OPENCODE_SKILLS_2"
    mkdir -p "$OPENCODE_SKILLS_1/agent-memory" "$OPENCODE_SKILLS_2/agent-memory"
    cp -f "$SKILL_SOURCE" "$OPENCODE_SKILLS_1/agent-memory/SKILL.md"
    cp -f "$SKILL_SOURCE" "$OPENCODE_SKILLS_2/agent-memory/SKILL.md"
}

install_agents_std() {
    STD_SKILLS="$HOME_DIR/.agents/skills"
    echo "  -> Instalando Skill en Agentes Estándar: $STD_SKILLS"
    mkdir -p "$STD_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$STD_SKILLS/agent-memory/SKILL.md"
}

install_copilot() {
    COPILOT_SKILLS="$HOME_DIR/.copilot/skills"
    echo "  -> Instalando Skill en GitHub Copilot: $COPILOT_SKILLS"
    mkdir -p "$COPILOT_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$COPILOT_SKILLS/agent-memory/SKILL.md"
}

install_hermes() {
    HERMES_SKILLS="$HOME_DIR/.hermes/skills"
    echo "  -> Instalando Skill en Hermes CLI: $HERMES_SKILLS"
    mkdir -p "$HERMES_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$HERMES_SKILLS/agent-memory/SKILL.md"
}

case $HARNESS_CHOICE in
    1)
        install_antigravity
        ;;
    2)
        install_opencode
        ;;
    3)
        install_agents_std
        ;;
    4)
        install_copilot
        ;;
    5)
        install_hermes
        ;;
    6)
        echo "🚀 Registrando en todos los arneses de IA..."
        install_antigravity
        install_opencode
        install_agents_std
        install_copilot
        install_hermes
        ;;
    7)
        echo "⏭️ Instalación de skill omitida."
        ;;
    *)
        echo "Opción no válida. Instalando en todos los entornos por defecto..."
        install_antigravity
        install_opencode
        install_agents_std
        install_copilot
        install_hermes
        ;;
esac

echo ""
echo "✅ [agents-memory] ¡Instalación completada con éxito!"
echo "💡 Puedes lanzar el Dashboard visual con: node scripts/memory-cli.js ui"
