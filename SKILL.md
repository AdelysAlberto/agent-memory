---
name: agent-memory
description: Autonomous local memory system to query and store synthetic semantic signatures in SQLite, reducing token consumption by up to 95% across AI Agent environments (Antigravity, Cursor, Copilot, OpenCode, Hermes).
---

# 🧠 Agent Memory Skill (Autonomous Memory System)

This skill enables AI agents to **query, register, and manage synthetic semantic signatures** in a centralized local SQLite database (`~/.agent-memory/memory.db`).

Its primary objective is to maintain architectural consistency across chat sessions while drastically reducing input token consumption by preventing repetitive reading of source code and documentation.

---

## ⚡ Autonomous Agent Operating Directives

### 1. Auto-Retrieval (Before Proposing or Designing Code)
Before implementing any new technical pattern, component, or architecture (e.g., pagination, auth, tables, state management, middleware):
- Silently query local memories by executing:
  ```bash
  agent-memory search --query "<concept_or_topic>"
  ```
  *(Note: If `--project` is omitted, the CLI automatically detects the current project name).*
- If a relevant previous signature exists, **adopt and adhere to the same technical pattern**, conventions, and previously approved architectural decisions.

### 2. 3-Layer Tag Taxonomy (Mandatory Rule)
To prevent information loss and vague tags, **EVERY saved memory signature MUST include 3 to 5 kebab-case tags organized into 3 layers**:
1. **Layer 1 - Main Concept / Domain**: Generic technical domain (e.g., `pagination`, `auth`, `state-management`, `api-rest`, `database`).
2. **Layer 2 - Technology / Tooling**: Exact tech stack involved (e.g., `sqlite`, `zustand`, `express`, `react`, `css-modules`).
3. **Layer 3 - Specific Module / Entity**: Project domain module (e.g., `products-list`, `users-table`, `jwt-middleware`).

*Tag Rule*: Always use lowercase, kebab-case, english/neutral terms without redundant synonyms.

### 3. Auto-Save & Visual Chat Notification 💾
Upon completing a refactoring, feature, or non-trivial bug fix, autonomously evaluate:
*Does this solution establish a reusable standard, solve a complex issue, or create a core module?*
- **IF YES**: Register the synthetic memory signature by executing:
  ```bash
  agent-memory save \
    --title "<brief_title>" \
    --summary "<dense_synthetic_summary>" \
    --category "<category>" \
    --tags "<layer1,layer2,layer3>"
  ```
- **MANDATORY CHAT NOTIFICATION**: Always append a 1-line confirmation at the very end of your response using the floppy disk icon:
  `💾 **Memoria Guardada**: [<project_name>] "<brief_title>" (Tags: #tag1, #tag2, #tag3)`

### 4. Automatic Initial Project Onboarding
When starting work on a new project or analyzing its general architecture for the first time:
- Execute the automatic synthesis onboarding command:
  ```bash
  agent-memory onboard
  ```
