# 🧠 Cogni

> **Cognitive Omniscient Grid for Networked Intelligence**  
> *Sistema de Memoria Autónoma de Alta Densidad & Reducción de Tokens para Agentes de IA.*  
> Compatible nativamente con **Antigravity**, **Cursor IDE**, **GitHub Copilot**, **OpenCode**, **Hermes CLI** y entornos Agentic universales.

Cogni almacena **firmas semánticas sintéticas** en una base de datos **SQLite local o centralizada**, reduciendo hasta un **95% el consumo de tokens de contexto** y garantizando la coherencia arquitectónica entre sesiones de desarrollo.

---

## ⚡ ¿Por qué Cogni?

1. **Binario Único Nativo (Go Core)**: Cero dependencias de runtime (no requiere Node.js, Python ni librerías dinámicas). Compila en un ejecutable estático ultra rápido (< 5 ms de arranque).
2. **Local-First & Global**: Soporte para bases de datos por proyecto (`.cogni/memory.db`) y almacenamiento global centralizado (`~/.cogni/memory.db`).
3. **Búsqueda FTS5 de Microsegundos**: Indexación de texto completo (Full-Text Search) sobre conceptos, títulos y etiquetas.
4. **Web UI Embebida**: Dashboard visual interactivo compilado dentro del binario con auto-detección de puerto libre (cero colisiones `EADDRINUSE`).
5. **Taxonomía de Tags en 3 Capas**: Estructuración determinista de conocimiento para evitar duplicación y pérdida de contexto.

---

## 🛠️ Instalación Rápida

### Vía Script de Instalación:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/AdelysAlberto/agent-memory/main/install.sh)
```

### O Compilando desde el Repositorio (Go 1.22+):
```bash
git clone https://github.com/AdelysAlberto/agent-memory.git cogni
cd cogni
make install
```

*El binario quedará disponible en `$HOME/.local/bin/cogni`.*

---

## 🚀 Flujo y Comandos de la CLI

```text
[Operador / Agente ejecuta acción]
                   │
                   ▼
       ¿Existe estándar previo?
        cogni search --query "auth"
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
      [ SÍ ]               [ NO ]
Recupera firma densa     Diseña solución
(~60 tokens) y aplica    y registra firma:
patrón preaprobado       cogni save 💾
```

### 1. Inicializar Memoria en un Proyecto Local
```bash
cogni init
```
*Crea la carpeta `.cogni/` en el proyecto actual y vincula las memorias a ese repositorio.*

### 2. Guardar una Firma Semántica
```bash
cogni save \
  --title "Middleware JWT con RSA256" \
  --summary "Se implementó JWT con RSA256 en internal/auth. Retorna Result[AuthSession]." \
  --category "auth" \
  --tags "auth,jwt,security"
```
*(El tag del proyecto se inyecta automáticamente).*

### 3. Buscar Memorias con FTS5
```bash
cogni search --query "jwt"
```

### 4. Actualizar una Memoria Existente
```bash
cogni update --id 6 --summary "Nueva versión de la firma sintética..."
```

### 5. Eliminar una Memoria
```bash
cogni remove --id 6
```

### 6. Exportar y Compartir Firmas
```bash
# Exportar en formato Markdown
cogni share --format markdown > memorias.md

# Exportar en formato JSON puro
cogni share --format json
```

### 7. Dashboard Gráfico Interactivo (Web UI)
```bash
cogni ui
```
*Inicia el servidor HTTP embebido en un puerto libre (ej. `http://127.0.0.1:3000`) y abre el navegador automáticamente.*

### 8. Estadísticas y Tokens Ahorrados
```bash
cogni stats
```

---

## 🏷️ Regla de las 3 Capas de Tags

Para garantizar una indexación óptima, cada memoria incluye etiquetas en 3 niveles:

1. **Capa 1 - Concepto Principal / Dominio**: Término genérico (`pagination`, `auth`, `state-management`, `api-rest`, `database`).
2. **Capa 2 - Tecnología / Herramienta**: Stack exacto (`go`, `sqlite`, `zustand`, `react`, `express`, `css-modules`).
3. **Capa 3 - Módulo / Entidad específica**: Dominio del proyecto (`users-table`, `products-list`, `jwt-middleware`).

---

## 🏗️ Arquitectura del Repositorio

```text
cogni/
├── cmd/cogni/main.go          # Entrypoint de la CLI
├── internal/
│   ├── cli/                   # Handlers de comandos (save, search, update, remove, share, ui, init)
│   ├── core/                  # Entidades de dominio, tags y resolución de proyectos
│   ├── server/                # Servidor HTTP embebido y APIs REST
│   └── storage/               # Repositorio SQLite Pure-Go con FTS5
├── web/                       # Assets estáticos embebidos (HTML/CSS/JS)
│   ├── embed.go
│   └── public/
├── Makefile                   # Tareas de compilación y pruebas
└── install.sh                 # Instalador universal multi-arnés
```

---

## 👨‍💻 Autor

Desarrollado y mantenido por **Adelys Alberto** ([@AdelysAlberto](https://github.com/AdelysAlberto)).

---

## 📄 Licencia

MIT
