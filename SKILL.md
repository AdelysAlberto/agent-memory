---
name: agent-memory
description: Sistema de memoria local autónomo para consultar y guardar firmas semánticas en SQLite, reduciendo hasta un 95% el consumo de tokens en entornos de Agentes de IA (Antigravity, Copilot, OpenCode, Hermes).
---

# 🧠 Agent Memory Skill (Sistema de Memoria Autónomo)

Esta skill te permite **consultar, registrar y gestionar firmas semánticas sintéticas** en una base de datos SQLite local embebida (`.agents/memory.db`). 

Su objetivo principal es mantener la consistencia arquitectónica entre conversaciones y sesiones, reduciendo drásticamente el consumo de tokens de entrada al evitar releer repetidamente el código fuente o la documentación.

---

## ⚡ Instrucciones de Operación Autónoma para el Agente

### 1. Auto-Consultas (Antes de Proponer o Diseñar Código)
Antes de implementar un patrón técnico nuevo, componente o arquitectura (ej. paginación, auth, tablas, estado, middleware):
- Consulta silenciosamente las memorias locales ejecutando:
  ```bash
  node /Users/adelysalberto/Projects/utils/agents-memory/scripts/memory-cli.js search --query "<concepto_o_tema>"
  ```
  *(Nota: Si omito `--project`, el script auto-detecta el proyecto actual).*
- Si existe una firma previa relevante, **adopta y respeta el mismo patrón técnico**, convenciones y decisiones previamente aprobadas.

### 2. Taxonomía de Tags en 3 Capas (Regla Obligatoria)
Para evitar pérdida de información y etiquetas vágas, **TODO guardado debe incluir de 3 a 5 tags en kebab-case organizados en 3 capas**:
1. **Capa 1 - Concepto Principal / Dominio**: Término técnico genérico (ej: `pagination`, `auth`, `state-management`, `api-rest`, `database`).
2. **Capa 2 - Tecnología / Herramienta**: Stack exacto involucrado (ej: `sqlite`, `zustand`, `express`, `react`, `css-modules`).
3. **Capa 3 - Módulo / Entidad específica**: Dominio del proyecto (ej: `products-list`, `users-table`, `jwt-middleware`).

### 3. Auto-Guardado & Notificación Visual 💾
Al completar una refactorización, feature o solución a un bug no trivial, evalúa autónomamente:
¿Esta solución establece un estándar reutilizable, soluciona un problema complejo o crea un módulo clave?
- **SI LA RESPUESTA ES SÍ**: Registra la firma de memoria ejecutando:
  ```bash
  node /Users/adelysalberto/Projects/utils/agents-memory/scripts/memory-cli.js save \
    --title "<titulo_breve>" \
    --summary "<resumen_sintetico_denso>" \
    --category "<categoria>" \
    --tags "<capa1,capa2,capa3>"
  ```
- **NOTIFICACIÓN OBLIGATORIA EN CHAT**: Confirma en 1 sola línea al usuario al final de la respuesta:
  `💾 **Memoria Guardada**: [<nombre_proyecto>] "<titulo_breve>" (Tags: #tag1, #tag2, #tag3)`

### 4. Auto-Onboarding Inicial de Proyectos
Al iniciar a trabajar en un proyecto nuevo o analizar su arquitectura general:
- Ejecuta el subcomando de síntesis automática:
  ```bash
  node /Users/adelysalberto/Projects/utils/agents-memory/scripts/memory-cli.js onboard
  ```
