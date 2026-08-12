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
        git clone --quiet https://github.com/AdelysAlberto/agent-memory.git "$TARGET_DIR"
    fi
    MEMORY_REPO_DIR="$TARGET_DIR"
else
    MEMORY_REPO_DIR="$(pwd)"
fi

SKILL_SOURCE="$MEMORY_REPO_DIR/SKILL.md"

# Instalar dependencias si no existen
if [ ! -d "$MEMORY_REPO_DIR/node_modules" ]; then
    echo "📦 Instalando dependencias de npm..."
    npm install --quiet --prefix "$MEMORY_REPO_DIR"
fi

# Inicializar BD
echo "🗄️ Inicializando base de datos SQLite embebida..."
node "$MEMORY_REPO_DIR/scripts/memory-cli.js" init

# Permisos
chmod +x "$MEMORY_REPO_DIR/scripts/memory-cli.js"

echo ""
echo "🤖 Selecciona el entorno o Harness de IA que utilizas:"
echo "1) Gemini Antigravity (~/.gemini/config/skills/)"
echo "2) GitHub Copilot (~/.copilot/skills/ & instructions)"
echo "3) OpenCode / OpenHands (~/.opencode/skills/)"
echo "4) Hermes CLI (~/.hermes/skills/)"
echo "5) Instalar en TODOS los entornos detectados"
echo "6) Omitir instalación automática de Skill"
echo ""

read -p "Ingresa tu opción (1-6) [por defecto: 5]: " HARNESS_CHOICE
HARNESS_CHOICE=${HARNESS_CHOICE:-5}

install_antigravity() {
    GEMINI_SKILLS="$HOME_DIR/.gemini/config/skills"
    echo "  -> Instalando Skill en Gemini Antigravity: $GEMINI_SKILLS"
    mkdir -p "$GEMINI_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$GEMINI_SKILLS/agent-memory/SKILL.md"
}

install_copilot() {
    COPILOT_SKILLS="$HOME_DIR/.copilot/skills"
    echo "  -> Instalando Skill en GitHub Copilot: $COPILOT_SKILLS"
    mkdir -p "$COPILOT_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$COPILOT_SKILLS/agent-memory/SKILL.md"
}

install_opencode() {
    OPENCODE_SKILLS="$HOME_DIR/.opencode/skills"
    echo "  -> Instalando Skill en OpenCode / OpenHands: $OPENCODE_SKILLS"
    mkdir -p "$OPENCODE_SKILLS/agent-memory"
    cp -f "$SKILL_SOURCE" "$OPENCODE_SKILLS/agent-memory/SKILL.md"
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
        install_copilot
        ;;
    3)
        install_opencode
        ;;
    4)
        install_hermes
        ;;
    5)
        echo "🚀 Registrando en todos los arneses de IA..."
        install_antigravity
        install_copilot
        install_opencode
        install_hermes
        ;;
    6)
        echo "⏭️ Instalación de skill omitida."
        ;;
    *)
        echo "Opción no válida. Instalando en todos los entornos por defecto..."
        install_antigravity
        install_copilot
        install_opencode
        install_hermes
        ;;
esac

echo ""
echo "✅ [agents-memory] ¡Instalación completada con éxito!"
echo "💡 Puedes lanzar el Dashboard visual con: node scripts/memory-cli.js ui"
