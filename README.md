# 🧠 agent-memory

> **Sistema de Memoria Local Autónoma & Reducción de Tokens para Agentes de IA.**  
> Compatible nativamente con **Antigravity**, **Cursor IDE**, **GitHub Copilot**, **OpenCode**, **Hermes CLI** y entornos Agentic universales.

Guarda **firmas semánticas sintéticas** en una base de datos **SQLite local unificada**, logrando reducir hasta un **95% el consumo de tokens de contexto** mientras mantiene la consistencia arquitectónica y el contexto exacto del proyecto día a día.

---

## 🎯 ¿Por qué nace `agent-memory`? (La Necesidad)

Cuando trabajas a diario con Agentes de IA en desarrollo de software, te enfrentas a 2 grandes problemas:

1. **Desperdicio Masivo de Tokens & Costos**: Cada vez que abres un nuevo chat o pides una refactorización, el agente suele releer archivos completos de tu código, documentación o artefactos para entender el estado actual. Esto consume entre **15,000 a 40,000 tokens por mensaje** repetidamente.
2. **Inconsistencia Arquitectónica ("Invento de Soluciones")**: Al no "recordar" cómo resolvieron juntos la paginación, la autenticación o los estados globales el martes pasado, el agente tiende a proponer patrones distintos o contradictorios días después, rompiendo los estándares de tu codebase.

---

## 💡 La Propuesta & Solución

`agent-memory` soluciona esto introduciendo **Memorias Sintéticas de 3 Capas en SQLite**:

- **Compresión Semántica**: En lugar de hacer que la IA vuelva a leer 500 líneas de código, el sistema extrae y guarda **firmas sintéticas densas** (~80 tokens) de las decisiones clave.
- **Auto-Recuperación Silenciosa (Before Coding)**: Antes de responder o proponer un nuevo diseño, el agente consulta la base de datos local (`agent-memory search --query "auth"`). Si encuentra un estándar previo, **adopta y respeta el mismo patrón exacto**.
- **Auto-Guardado Autónomo (After Coding)**: Al terminar un hito importante, refactor o fix no trivial, el agente evalúa de forma autónoma la solución y guarda la firma semántica notificándote en el chat con el ícono 💾.

```text
[Usuario: "Crea la paginación de productos"]
                   │
                   ▼
  [Agente busca en SQLite local] ──> ¿Existe patrón previo de paginación?
                   │
                   ├──> SÍ: Recupera la firma (~60 tokens). Aplica Result Pattern + Zustand exacto.
                   └──> NO: Diseña la mejor solución y guarda la firma para el futuro 💾.
```

---

## ⚡ Instalación Automática en 1 Paso

Instala y configura automáticamente la CLI binaria global y las skills de tus arneses de IA ejecutando en terminal:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/AdelysAlberto/agent-memory/main/install.sh)
```

*El instalador te permitirá elegir en qué arneses de IA registras la Skill (Antigravity, Cursor, OpenCode, Copilot, Hermes o Todos).*

---

## 🚀 Flujo en el Día a Día de Desarrollo

Una vez instalado, el comando `agent-memory` está disponible globalmente en cualquier terminal:

### 1. Onboarding de un Proyecto Nuevo
Al abrir un repositorio por primera vez, ejecuta:
```bash
agent-memory onboard
```
*Sintetiza automáticamente el `README.md` / `package.json` registrando la firma inicial de arquitectura.*

### 2. Guardar Memorias de Decisión o Refactors
El agente lo hará de forma autónoma, pero también puedes invocarlo manualmente:
```bash
agent-memory save \
  --title "Middleware JWT con RSA256" \
  --summary "Se configuró el middleware en src/auth.js usando Result Pattern y Zustand." \
  --category "auth" \
  --tags "auth,jwt,security"
```

### 3. Consultar / Buscar Memorias
```bash
agent-memory search --query "jwt"
```

### 4. Dashboard Visual (UI)
Explora, busca y administra tus memorias sintéticas en una interfaz dark/glassmorphism:
```bash
agent-memory ui
```
*Inicia el dashboard local en `http://localhost:3000`.*

### 5. Actualizar el Sistema
Mantén el CLI, las skills y la BD al día con un solo comando:
```bash
agent-memory update
```

---

## 🏷️ Taxonomía de Tags en 3 Capas

Para garantizar que el agente busque y encuentre la información sin duplicar o perder datos, todas las memorias se organizan en 3 capas de etiquetas:

1. **Capa 1 - Concepto / Dominio**: Término genérico (`pagination`, `auth`, `state-management`, `database`).
2. **Capa 2 - Tecnología**: Stack exacto (`sqlite`, `zustand`, `react`, `express`, `css-modules`).
3. **Capa 3 - Módulo / Entidad**: Pieza específica de tu app (`users-table`, `products-list`, `jwt-middleware`).

---

## 🛠️ Arquitectura Técnica

- **Base de Datos Centralizada**: SQLite3 embebida en `~/.agent-memory/memory.db`.
- **CLI Runtime**: Node.js >= 18 (Binario global `agent-memory`).
- **Dashboard Visual**: HTTP REST API + Frontend SPA Dark Mode / Glassmorphism.
- **Compatibilidad Multi-Harness**: Antigravity (`~/.gemini/`), Cursor (`~/.cursor/`), OpenCode (`~/.config/opencode/` & `~/.agents/`), Copilot (`~/.copilot/`), Hermes (`~/.hermes/`).

---

## 👨‍💻 Creador & Autor

Desarrollado y mantenido por **Adelys Alberto** ([@AdelysAlberto](https://github.com/AdelysAlberto)).

---

## 📄 Licencia

MIT
