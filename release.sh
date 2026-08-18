#!/usr/bin/env bash

set -e

TYPE="${1:-patch}"

if [[ "$TYPE" != "patch" && "$TYPE" != "minor" && "$TYPE" != "major" ]]; then
    echo "❌ Tipo de versión inválido: $TYPE"
    echo "Uso: ./release.sh [patch|minor|major]"
    exit 1
fi

# Obtener última tag de git
LATEST_TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo "v2.0.3")"
VERSION="${LATEST_TAG#v}"

IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

case "$TYPE" in
    patch)
        PATCH=$((PATCH + 1))
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
esac

NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

echo "🏷️ Incrementando versión: ${LATEST_TAG} -> ${NEW_TAG}"

# Asegurar working tree limpio o hacer commit si hay cambios pendientes
if [[ -n $(git status --porcelain) ]]; then
    echo "📦 Guardando cambios detectados en git..."
    git add .
    git commit -m "chore: release ${NEW_TAG}"
fi

echo "🔨 Compilando binarios locales con ldflags ${NEW_TAG}..."
mkdir -p bin
go build -ldflags="-s -w -X github.com/AdelysAlberto/cogni/internal/cli.Version=${NEW_TAG}" -o bin/cogni ./cmd/cogni

# Si gh CLI está disponible, podemos crear un release en GitHub con el binario
echo "📌 Creando git tag ${NEW_TAG}..."
git tag -a "${NEW_TAG}" -m "Release ${NEW_TAG}"

echo "🚀 Subiendo cambios y tag a GitHub..."
git push origin main
git push origin "${NEW_TAG}"

if command -v gh &>/dev/null; then
    echo "📦 Generando GitHub Release y adjuntando binarios..."
    gh release create "${NEW_TAG}" bin/cogni --title "${NEW_TAG}" --notes "Release ${NEW_TAG}" || true
fi

echo "✅ ¡Release ${NEW_TAG} publicado con éxito!"
