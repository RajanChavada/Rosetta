# ┏┓┏┓┏┳┓┏┓┏┓
# ┃┃┃┃ ┃ ┣┫┃┃
# ┛┗┗┛ ┻ ┛┗┗┛
# ROSETTA

> **Single Source of Truth for AI Agent Rules and Engineering Memory.**

Rosetta is a CLI tool designed to help engineering teams maintain a consistent "Global Brain" for their AI agents (GitHub Copilot, Cursor, Windsurf, Claude Code) across an entire repository.

Instead of duplicating instructions in every IDE-specific hidden file, you define your project's soul in `.ai/master-skill.md`. Rosetta then generates independent IDE wrappers (like `CLAUDE.md` or `.cursorrules`) that reference your project spec *without* using symlinks, ensuring maximum compatibility across all tools.

---

## ⚡ Quickstart (Today)

1. **Initialize Rosetta** in your repo:
   ```bash
   node cli.js scaffold
   ```
   *Note: In the future, this will be `npx rosetta scaffold`.*

2. **Choose Your Path**:
   - Select **"Scaffold new agentic coding setup"**.
   - Pick the **"Agentic starter"** preset.
   - Provide your tech stack and context (or skip to use defaults).
   - Select the IDEs you use (VSCode, Cursor, etc.).

3. **Explore Your Brain**:
   - Inspect `.ai/master-skill.md` – This is your primary specification.
   - Inspect `.ai/memory/PROJECT_MEMORY.md` – The home for architectural decisions.
   - Look at your IDE wrappers (`CLAUDE.md`, `.cursorrules`) – They now point to the `.ai/` directory.

---

## ✨ Key Features

- **Centralized Spec**: One master markdown file to rule them all.
- **3-Layer Memory Protocol**:
  - `PROJECT_MEMORY.md`: Long-lived architectural decisions.
  - `AUTO_MEMORY.md`: Learned heuristics and agent "gotchas."
  - `Daily Logs`: Chronological record of progress and experiments.
- **Multi-IDE Support**: Automatically generates and updates wrappers for all major AI editors.
- **Stateless Skills**: Pull in reusable skill templates from a global or local catalog.

---

## 🛠️ Commands & Roadmap

> **Status Note**: Rosetta is under active development. Commands marked with `(planned)` are on the roadmap but not yet fully implemented.

### Core Commands
- **Scaffold**: `rosetta scaffold` – Set up the `.ai/` architecture.
- **Sync**: `rosetta sync` – Ensure IDE wrappers are consistent with the master spec.
- **Watch**: `rosetta watch` – Monitor the master spec and notify on changes.
- **New Skill**: `rosetta new-skill <name>` – Create a new stateless skill.

### Planned Features
- **Rescaffold (planned)**: `rosetta rescaffold <type>` – Selective re-generation of memory or IDE files.
- **Migration (planned)**: 
  - `rosetta migrate` – Interactive wizard to convert existing repos.
  - `migrate-from-cursor` / `migrate-from-claude` – Specialized one-click migrations.
- **Profiles (planned)**: `rosetta use-profile <name>` – Switch between team/org defaults.
- **Registry / Market (planned)**: `rosetta search`, `rosetta install-skill` – Use community skills.
- **Health & Validation (planned)**: `rosetta health`, `rosetta validate` – Check repo compliance.
- **Memory Sync (planned)**: `rosetta sync-memory` – Automatically rotate and summarize daily logs.

---

## 📂 Architecture & Design

Deep dives into the system design can be found in the `Features/` directory:

- [Plugin System Overview](file:///Users/jimmychavada/Documents/Rosetta/Features/1.md)
- [Discovery & Resolution Rules](file:///Users/jimmychavada/Documents/Rosetta/Features/2.md)
- [Config-Driven Scaffolding](file:///Users/jimmychavada/Documents/Rosetta/Features/4.md)
- [Migration Wizard Logic](file:///Users/jimmychavada/Documents/Rosetta/Features/6.md)
- [Roadmap & Priorities](file:///Users/jimmychavada/Documents/Rosetta/Features/9.md)

---

## 🏢 Extending Rosetta in Your Org

You don’t need to fork Rosetta to customize it for your team:

1. **Custom Skills**: Drop `.skill.md` files into `skills/` or `.rosetta/skills/`.
2. **Custom Presets**: Create `.preset.md` files in `.rosetta/presets/`.
3. **Configuration**: Use a `.rosetta.json` file in your repo root to define:
   - `defaultPreset` / `defaultIdes`
   - `skills.alwaysInclude`
   - `postScaffoldHooks` (runs shell scripts after scaffolding)

---

## 🎨 Starter Templates

- **Minimal**: A blank structure for experienced users.
- **Agentic starter**: Optimized for general software development.
- **Skill-creator style starter**: Specifically designed to help you build and iterate on `SKILL.md` files.

---

## ⚖️ License

MIT © [Rajan Chavada](https://github.com/RajanChavada)
