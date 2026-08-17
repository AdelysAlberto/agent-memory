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

> *"Just as a Byte is the fundamental unit of raw data, a Cogni is the unit of synthetic knowledge for your AI agent."*

**Cogni** (*Cognitive Omniscient Grid for Networked Intelligence*) enables AI agents to **query, register, update, and manage synthetic semantic signatures** in a fast local or global SQLite database (` + "`.cogni/memory.db`" + ` or ` + "`~/.cogni/memory.db`" + `).

Its primary objective is to maintain architectural consistency across chat sessions while drastically reducing input token consumption by preventing repetitive reading of source code and documentation.

---

## ⚡ Autonomous Agent Operating Directives

### 1. Auto-Retrieval / When to Search (Reactive & Proactive Search)
- **Reactive Search**: Execute ` + "`cogni search --query \"<keywords>\"`" + ` immediately when the user asks to recall past work (e.g., "remember", "recall", "what did we do", "how did we solve").
- **Proactive Search**: Before proposing or designing any new technical pattern, component, or architecture (e.g., pagination, auth, tables, state management, middleware):
  ` + "```bash\n  cogni search --query \"<concept_or_topic>\"\n  ```" + `
- If a relevant previous signature exists, **adopt and adhere to the same technical pattern**, conventions, and previously approved architectural decisions.
- **MANDATORY CHAT NOTIFICATION ON RETRIEVAL**: When retrieved memories influence your response, append a 1-line confirmation:
  ` + "`🧠 **Memoria Recuperada**: [<project_name>] \"<retrieved_title_or_topic>\" (Tags: #tag1, #tag2)`" + `

### 2. When to Save (Mandatory Save Triggers)
Call ` + "`cogni save`" + ` IMMEDIATELY after completing any of the following actions:
- **Bugfix**: Resolution of a non-trivial error or bug (` + "`--category bugfix`" + `).
- **Architecture / Decision**: Choice of libraries, data models, or system structures (` + "`--category architecture`" + ` or ` + "`--category decision`" + `).
- **Discovery**: Non-obvious finding about system/codebase behavior (` + "`--category discovery`" + `).
- **Config**: Environment setup, tooling, or script configuration (` + "`--category config`" + `).
- **Pattern**: Established naming convention, file structure, or technical standard (` + "`--category pattern`" + `).
- **Preference**: User preference or constraint learned during the session (` + "`--category preference`" + `).

### 3. Synthetic Summary Format (` + "`--summary`" + `)
To maximize token savings and preserve high information density, every ` + "`--summary`" + ` MUST follow this structured format:
` + "`What: <One sentence description of what was done> | Why: <Motivation or root cause> | Where: <Key files/paths affected> | Learned: <Gotchas or key learnings (omit if none)>`" + `

### 4. 3-Layer Tag Taxonomy (Mandatory Rule)
EVERY saved memory signature MUST include 3 to 5 kebab-case tags organized into 3 layers:
1. **Layer 1 - Main Concept / Domain**: Generic technical domain (e.g., ` + "`pagination`" + `, ` + "`auth`" + `, ` + "`state-management`" + `, ` + "`api-rest`" + `, ` + "`database`" + `).
2. **Layer 2 - Technology / Tooling**: Exact tech stack involved (e.g., ` + "`go`" + `, ` + "`sqlite`" + `, ` + "`zustand`" + `, ` + "`express`" + `, ` + "`react`" + `, ` + "`css-modules`" + `).
3. **Layer 3 - Specific Module / Entity**: Project domain module (e.g., ` + "`products-list`" + `, ` + "`users-table`" + `, ` + "`jwt-middleware`" + `).

*Tag Rule*: Always use lowercase, kebab-case, neutral English terms without redundant synonyms. The CLI automatically appends the project tag.

### 5. Topic Update Rules
- If an existing solution or architecture evolves, **avoid creating duplicate signatures**.
- Search for the existing observation ID via ` + "`cogni search`" + ` and update it using ` + "`cogni update --id <id> --summary \"<new_summary>\"`" + `.

### 6. Auto-Save & Visual Chat Notification 💾
When saving or updating a memory signature, always append a 1-line confirmation at the very end of your response:
` + "`💾 **Memoria Guardada**: [<project_name>] \"<brief_title>\" (Category: #category, Tags: #tag1, #tag2, #tag3)`" + `

---

## 🛠️ CLI Reference

` + "```bash\n# Save structured synthetic memory\ncogni save \\\n  --title \"Fixed N+1 Query in Product List\" \\\n  --category \"bugfix\" \\\n  --tags \"database,sqlite,products-list\" \\\n  --summary \"What: Added index on category_id and joined queries | Why: Resolves slow load on 10k rows | Where: src/db/products.go | Learned: SQLite requires explicit EXPLAIN QUERY PLAN verification\"\n\n# Search memories using FTS5\ncogni search --query \"products\"\n\n# Update existing memory by ID to prevent topic duplication\ncogni update --id 6 --summary \"What: Updated auth to JWT + Rotation | Why: Security audit | Where: src/auth/jwt.go\"\n\n# Remove a memory entry\ncogni remove --id 6\n\n# Share / Export signatures (Markdown / JSON)\ncogni share --format markdown\n\n# Initialize local .cogni database in current project\ncogni init\n\n# Open visual web dashboard in browser\ncogni ui\n```" + `
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
