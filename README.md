# 🧠 agents-memory

Sistema de memoria local ultra liviano y portátil para Agentes de IA en Antigravity, Cursor, Copilot, OpenCode y entornos Agentic.

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

## 🚀 Uso Rápido (CLI Global)

Una vez instalado, el comando `agent-memory` está disponible globalmente en cualquier terminal:

### 1. Inicializar la Base de Datos Global
```bash
agent-memory init
```
*Crea la base de datos centralizada en `~/.agent-memory/memory.db`.*

### 2. Guardar una Memoria / Firma de Decisión
```bash
agent-memory save \
  --title "Autenticación JWT implementada" \
  --summary "Se configuró el middleware de JWT usando RSA256 en src/auth.js" \
  --category "auth" \
  --tags "security,jwt,auth"
```

### 3. Consultar / Buscar Memorias Relevantes
```bash
agent-memory search --query "JWT"
```

### 4. Abrir el Dashboard Visual (UI)
```bash
agent-memory ui
```
*Inicia un servidor local en `http://localhost:3000` con un Dashboard visual moderno (dark mode / glassmorphism).*

### 5. Actualizar Sistema & Skills a la Última Versión
```bash
agent-memory update
```
*Descarga los últimos cambios desde Git, actualiza dependencias y re-sincroniza las skills en tus entornos de IA.*

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

- **Motor de BD**: SQLite3 Embebido (almacenado centralizadamente en `~/.agent-memory/memory.db`).
- **CLI Runtime**: Node.js >= 18.
- **Formato de Respuesta**: JSON denso / Formato legible en terminal.
- **Cross-Platform**: Funciona nativamente en macOS, Linux y Windows.

---

## 👨‍💻 Creador & Autor

Desarrollado y mantenido por **Adelys Alberto** ([@AdelysAlberto](https://github.com/AdelysAlberto)).

---

## 📄 Licencia

MIT
