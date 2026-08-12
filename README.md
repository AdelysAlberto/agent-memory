# 🧠 agents-memory

Sistema de memoria local ultra liviano y portátil para Agentes de IA en Antigravity, VS Code y entornos Agentic.

Guarda **firmas semánticas sintéticas** en una base de datos **SQLite local embebida**, logrando reducir hasta un **95% el consumo de tokens** e inyectando únicamente el contexto necesario por sesión.

---

## ⚡ Instalación Automática en 1 Solo Paso

Puedes instalar y configurar automáticamente el sistema en cualquier proyecto o equipo ejecutando:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/AdelysAlberto/agent-memory/main/install.sh)
```

O si clonaste el repositorio manualmente:

```bash
chmod +x install.sh
./install.sh
```

---

## 🚀 Uso Rápido (CLI)

### 1. Inicializar la Base de Datos Global
```bash
node scripts/memory-cli.js init
```
*Crea la base de datos centralizada en `~/.agents-memory/memory.db`.*

### 2. Guardar una Memoria / Firma de Decisión
```bash
node scripts/memory-cli.js save \
  --project "mi-proyecto" \
  --title "Autenticación JWT implementada" \
  --summary "Se configuró el middleware de JWT usando RSA256 en src/auth.js" \
  --category "auth" \
  --tags "security,jwt,auth"
```

### 3. Consultar / Buscar Memorias Relevantes
```bash
node scripts/memory-cli.js search \
  --project "mi-proyecto" \
  --query "JWT"
```

### 4. Abrir el Dashboard Visual (UI)
```bash
node scripts/memory-cli.js ui
# o
npm run ui
```
*Inicia un servidor local en `http://localhost:3000` con un Dashboard visual moderno (dark mode / glassmorphism) para explorar, buscar, crear y eliminar memorias sintetizadas.*

---

## 🤖 Integración con Agentes (Antigravity)

La skill global ha sido registrada automáticamente en:
`~/.gemini/config/skills/agent-memory/SKILL.md`

### Cómo invocarte desde el chat de Antigravity:
1. Puedes pedirle al agente:
   > *"Consulta la memoria del proyecto sobre la autenticación"*
   o utilizar la skill invocando `/agent-memory`.

2. Al finalizar una sesión o cambio importante, pídele al agente:
   > *"Guarda en memoria que refactorizamos el módulo de autenticación"*.


---

## 🛠️ Arquitectura Técnica

- **Motor de BD**: SQLite3 Embebido (almacenado en `.agents/memory.db`).
- **CLI Runtime**: Node.js >= 18.
- **Formato de Respuesta**: JSON denso / Formato legibe en terminal.
- **Cross-Platform**: Funciona nativamente en macOS, Linux y Windows.

---

## 📄 Licencia

MIT
