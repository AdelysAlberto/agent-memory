package core

import (
	_ "embed"
	"os"
	"path/filepath"
)

// SkillContent embeds the canonical Cogni skill definition
const SkillContent = `---
name: cogni
description: Autonomous local memory system to query and store synthetic semantic signatures in SQLite, reducing token consumption by up to 95% across AI Agent environments (Antigravity, Cursor, Claude, Copilot, OpenCode, Hermes).
---

# 🧠 Cogni Skill (Autonomous AI Agent Memory System)

**Cogni** (*Cognitive Omniscient Grid for Networked Intelligence*) enables AI agents to **query, register, update, and manage synthetic semantic signatures** in a fast local or global SQLite database (` + "`.cogni/memory.db`" + ` or ` + "`~/.cogni/memory.db`" + `).

Its primary objective is to maintain architectural consistency across chat sessions while drastically reducing input token consumption by preventing repetitive reading of source code and documentation.

---

## ⚡ Autonomous Agent Operating Directives

### 1. Auto-Retrieval (Before Proposing or Designing Code)
Before implementing any new technical pattern, component, or architecture (e.g., pagination, auth, tables, state management, middleware):
- Silently query local memories by executing:
  ` + "```bash\n  cogni search --query \"<concept_or_topic>\"\n  ```" + `
  *(Note: If ` + "`--project`" + ` is omitted, the CLI automatically detects the current project name and git workspace).*
- If a relevant previous signature exists, **adopt and adhere to the same technical pattern**, conventions, and previously approved architectural decisions.

### 2. 3-Layer Tag Taxonomy (Mandatory Rule)
To prevent information loss and vague tags, **EVERY saved memory signature MUST include 3 to 5 kebab-case tags organized into 3 layers**:
1. **Layer 1 - Main Concept / Domain**: Generic technical domain (e.g., ` + "`pagination`" + `, ` + "`auth`" + `, ` + "`state-management`" + `, ` + "`api-rest`" + `, ` + "`database`" + `).
2. **Layer 2 - Technology / Tooling**: Exact tech stack involved (e.g., ` + "`go`" + `, ` + "`sqlite`" + `, ` + "`zustand`" + `, ` + "`express`" + `, ` + "`react`" + `, ` + "`css-modules`" + `).
3. **Layer 3 - Specific Module / Entity**: Project domain module (e.g., ` + "`products-list`" + `, ` + "`users-table`" + `, ` + "`jwt-middleware`" + `).

*Tag Rule*: Always use lowercase, kebab-case, english/neutral terms without redundant synonyms. The CLI automatically appends the project tag.

### 3. Auto-Save & Visual Chat Notification 💾
Upon completing a refactoring, feature, or non-trivial bug fix, autonomously evaluate:
*Does this solution establish a reusable standard, solve a complex issue, or create a core module?*
- **IF YES**: Register the synthetic memory signature by executing:
  ` + "```bash\n  cogni save \\\n    --title \"<brief_title>\" \\\n    --summary \"<dense_synthetic_summary>\" \\\n    --category \"<category>\" \\\n    --tags \"<layer1,layer2,layer3>\"\n  ```" + `
- **MANDATORY CHAT NOTIFICATION**: Always append a 1-line confirmation at the very end of your response using the floppy disk icon:
  ` + "`💾 **Memoria Guardada**: [<project_name>] \"<brief_title>\" (Tags: #tag1, #tag2, #tag3)`" + `

---

## 🛠️ CLI Reference

` + "```bash\n# Guardar memoria sintética\ncogni save --title \"Título\" --summary \"Firma...\" --category architecture --tags \"tag1,tag2\"\n\n# Buscar memorias con FTS5\ncogni search --query \"termino\"\n\n# Actualizar memoria existente por ID\ncogni update --id 6 --summary \"Nueva firma...\"\n\n# Eliminar memoria\ncogni remove --id 6\n\n# Compartir / Exportar firmas (Markdown / JSON)\ncogni share --format markdown\n\n# Inicializar .cogni local en el proyecto actual\ncogni init\n\n# Abrir dashboard visual en navegador\ncogni ui\n```" + `
`

// InstallSkill writes the embedded SKILL.md to the specified directory
func InstallSkill(targetDir string) error {
	skillDir := filepath.Join(targetDir, "cogni")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		return err
	}

	dest := filepath.Join(skillDir, "SKILL.md")
	return os.WriteFile(dest, []byte(SkillContent), 0644)
}

// GetHarnessSkillPaths returns all supported AI harness skill directory paths
func GetHarnessSkillPaths(homeDir string) map[string][]string {
	return map[string][]string{
		"local": {
			filepath.Join(".agents", "skills"),
		},
		"antigravity": {
			filepath.Join(homeDir, ".gemini", "config", "skills"),
		},
		"cursor": {
			filepath.Join(homeDir, ".cursor", "skills"),
		},
		"claude": {
			filepath.Join(homeDir, ".claude", "skills"),
		},
		"opencode": {
			filepath.Join(homeDir, ".config", "opencode", "skills"),
			filepath.Join(homeDir, ".agents", "skills"),
		},
		"copilot": {
			filepath.Join(homeDir, ".copilot", "skills"),
		},
		"hermes": {
			filepath.Join(homeDir, ".hermes", "skills"),
		},
	}
}
