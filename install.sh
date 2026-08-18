#!/usr/bin/env bash

set -e

echo "🧠 ========================================================"
echo "   [Cogni] Instalador Universal de Memoria para Agentes"
echo "   Cognitive Omniscient Grid for Networked Intelligence"
echo "   \"Así como el Byte es la unidad de datos,"
echo "    Cogni es la unidad de conocimiento sintético de tu agente.\""
echo "========================================================"

HOME_DIR="$HOME"
TARGET_DIR="$HOME_DIR/.cogni"
BIN_INSTALL_DIR="$HOME_DIR/.local/bin"
SRC_CACHE_DIR="$HOME_DIR/.cogni-src"

mkdir -p "$TARGET_DIR"
mkdir -p "$BIN_INSTALL_DIR"

# Determinar si estamos dentro del repositorio clonado o ejecutando vía curl
if [ -f "go.mod" ] && grep -q "github.com/AdelysAlberto/cogni" go.mod 2>/dev/null; then
    REPO_DIR="$(pwd)"
else
    echo "📥 Descargando código fuente de Cogni..."
    if [ -d "$SRC_CACHE_DIR/.git" ]; then
        git -C "$SRC_CACHE_DIR" fetch --tags --quiet
        git -C "$SRC_CACHE_DIR" reset --hard --quiet origin/main
    else
        rm -rf "$SRC_CACHE_DIR"
        git clone --quiet https://github.com/AdelysAlberto/cogni-memory.git "$SRC_CACHE_DIR"
    fi
    REPO_DIR="$SRC_CACHE_DIR"
fi

# Detectar OS y arquitectura para descarga de binario precompilado
detect_platform() {
    local os arch
    os="$(uname -s | tr '[:upper:]' '[:lower:]')"
    arch="$(uname -m)"
    case "$arch" in
        x86_64)  arch="amd64" ;;
        aarch64|arm64) arch="arm64" ;;
        armv7l)  arch="arm" ;;
        *)       arch="$arch" ;;
    esac
    echo "${os}_${arch}"
}

# Intentar instalar Go automáticamente según la distro
try_install_go() {
    echo "🔍 Go no encontrado. Intentando instalarlo automáticamente..."

    # Usar if/then en lugar de && para que set -e no interrumpa el script si falla
    if command -v snap &>/dev/null; then
        echo "📦 Instalando Go vía snap (se puede requerir contraseña)..."
        if sudo snap install go --classic 2>/dev/null; then return 0; fi
    fi

    if command -v apt-get &>/dev/null; then
        echo "📦 Instalando Go vía apt (se puede requerir contraseña)..."
        if sudo apt-get update -qq && sudo apt-get install -y golang-go 2>/dev/null; then return 0; fi
    fi

    if command -v dnf &>/dev/null; then
        echo "📦 Instalando Go vía dnf (se puede requerir contraseña)..."
        if sudo dnf install -y golang 2>/dev/null; then return 0; fi
    fi

    if command -v pacman &>/dev/null; then
        echo "📦 Instalando Go vía pacman (se puede requerir contraseña)..."
        if sudo pacman -S --noconfirm go 2>/dev/null; then return 0; fi
    fi

    if command -v brew &>/dev/null; then
        echo "📦 Instalando Go vía Homebrew..."
        if brew install go 2>/dev/null; then return 0; fi
    fi

    return 1
}

# 1. Intentar descargar binario precompilado desde GitHub Releases
PLATFORM="$(detect_platform)"
LATEST_RELEASE_URL="https://github.com/AdelysAlberto/cogni-memory/releases/latest/download/cogni_${PLATFORM}"

echo "🔍 Buscando binario precompilado para $PLATFORM..."
if curl -fsSL --head "$LATEST_RELEASE_URL" &>/dev/null; then
    echo "⬇️  Descargando binario precompilado para $PLATFORM..."
    curl -fsSL "$LATEST_RELEASE_URL" -o "$BIN_INSTALL_DIR/cogni"
    chmod +x "$BIN_INSTALL_DIR/cogni"
    echo "✅ Binario instalado en $BIN_INSTALL_DIR/cogni"

# 2. Compilar si Go está disponible
elif command -v go &>/dev/null; then
    echo "🔨 Compilando binario de Cogni en Go..."
    (cd "$REPO_DIR" && go build -ldflags="-s -w" -o "$BIN_INSTALL_DIR/cogni" ./cmd/cogni)
    chmod +x "$BIN_INSTALL_DIR/cogni"
    echo "✅ Binario instalado en $BIN_INSTALL_DIR/cogni"

# 3. Copiar binario incluido en el repo si existe
elif [ -f "$REPO_DIR/bin/cogni" ]; then
    echo "📦 Copiando binario precompilado del repositorio..."
    cp "$REPO_DIR/bin/cogni" "$BIN_INSTALL_DIR/cogni"
    chmod +x "$BIN_INSTALL_DIR/cogni"

# 4. Intentar instalar Go automáticamente y compilar
elif try_install_go; then
    # Refrescar PATH por si snap/apt lo añadió
    export PATH="$PATH:/snap/bin:/usr/local/go/bin"
    if command -v go &>/dev/null; then
        echo "🔨 Compilando binario de Cogni en Go..."
        (cd "$REPO_DIR" && go build -ldflags="-s -w" -o "$BIN_INSTALL_DIR/cogni" ./cmd/cogni)
        chmod +x "$BIN_INSTALL_DIR/cogni"
        echo "✅ Binario instalado en $BIN_INSTALL_DIR/cogni"
    else
        echo "⚠️  Go fue instalado pero requiere reiniciar la terminal."
        echo "   Ejecuta de nuevo el instalador tras abrir una nueva terminal."
        exit 1
    fi

# 5. Nada funcionó — guiar al usuario
else
    echo ""
    echo "❌ No se pudo instalar Cogni automáticamente."
    echo ""
    echo "   Cogni requiere Go >= 1.22. Instálalo con uno de estos métodos:"
    echo ""
    echo "   Ubuntu/Debian:   sudo snap install go --classic"
    echo "                 o  sudo apt install golang-go"
    echo "   Fedora/RHEL:     sudo dnf install golang"
    echo "   Arch Linux:      sudo pacman -S go"
    echo "   macOS:           brew install go"
    echo "   Manual:          https://go.dev/dl/"
    echo ""
    echo "   Luego vuelve a ejecutar:"
    echo "   bash <(curl -fsSL https://raw.githubusercontent.com/AdelysAlberto/cogni-memory/main/install.sh)"
    echo ""
    exit 1
fi

SKILL_SOURCE="$REPO_DIR/SKILL.md"

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
echo "   - cogni upgrade     (Verifica y actualiza a la última versión)"
echo "   - cogni share       (Exporta memorias en Markdown)"
echo "   - cogni stats       (Métricas de tokens ahorrados)"
echo ""
