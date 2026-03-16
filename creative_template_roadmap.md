## Creative Template Roadmap

this roadmap will refactor all the static templates we have to make them that much more robust and detailed no matter whay the template is for users:

---
name: template-refactor-roadmap
description: Orchestrates systematic refactoring of all project templates for maximum creativity, repo-awareness, and agent compatibility
domains:
  - devex
  - ai-workflows
  - code-generation
---

# Template Refactoring Roadmap Skill

## Intent
Transform generic, static templates into dynamic, repo-aware, creativity-boosting prompts that make Copilot/Claude 10x more effective at generating Rosetta skills and project scaffolds. Standardize all `.md` templates across your codebase.

## When to Use
- When `rosetta ideate` generates "basic refactor" skills instead of domain-specific genius
- When feeding templates to Copilot produces generic responses
- When starting any template maintenance or new template creation
- Run this FIRST before any template ideation session

## Pre-Checks
- Scan for template files: `find . -name "*-template*.md" -o -name "*.prompt.md" -o -name "ideation*.md"`
- Extract repo blueprint: languages, frameworks, tests, directories, primaryArchitecture from analysis
- Check existing `.ai/` structure and IDE-specific folders (VSCode, Cursor, etc.)
- List current pain points from recent Copilot/Claude sessions

## Workflow

### 1. AUDIT PHASE
**Create `TEMPLATES-AUDIT.md` table:**

```markdown
| Template File | Current Lines | Issues | Priority | Target Creativity Score |
|---------------|---------------|--------|----------|------------------------|
| skill-ideation-template.md | 120 | Basic questions only | HIGH | 9/10 |
| [others...] | ... | ... | ... | ... |
Score each template 1-10 on:

Repo-awareness (uses ${languages}, ${frameworks} dynamically?)

Creativity triggers (reasoning modes, lenses, inversion thinking?)

Copilot compatibility (Goal/Context/Constraints/Examples/Format?)

Actionability (generates concrete SKILL.md files?)

2. DESIGN PATTERNS
Create master patterns.md with these REQUIRED sections for ALL templates:

text
## CORE PERSONA (Copy to top of every template)
You are Senior AI Solutions Architect + Agentic Workflow Expert + [DOMAIN] Specialist

## REASONING MODES (3+ required)
1. Divergent ideation → 5-10 raw ideas
2. Convergence → Cluster into 2-4 themes  
3. Inversion → "What breaks without this?"
4. Self-critique → 2-3 failure modes per proposal

## REPO HOOKS (Dynamic injection)
- Languages: ${languages.join(', ')}
- Frameworks: ${frameworks.join(', ')} 
- Tests: ${tests.length ? tests.join(', ') : 'MISSING'}
- Auto-suggest skills for: ${primaryArchitecture}
3. SYSTEMATIC IMPLEMENTATION
High Priority Batch (Do first):

text
✅ skill-ideation-template.md
✅ prompt-generators/
✅ CLI scaffolds (README.md, etc.)
For EACH template, inject:

text
1. Repository Blueprint section (prominent, top 20% of file)
2. 3+ reasoning modes section
3. Interaction loop: Questions → Proposals → Refine
4. SKILL.md spec with YAML frontmatter + Guardrails
5. "Treat this as SYSTEM PROMPT" footer
Template length limits:

Total: <250 lines

Questions section: <30 lines

Each SKILL.md draft: <120 lines

Repo blueprint: <15 lines

4. VALIDATE WITH LIVE TESTS
Test command for each refactored template:

bash
# 1. Generate with rosetta
rosetta ideate --template=new-skill-ideation-template.md

# 2. Copy output to Copilot/Claude
# 3. Score response on:
#    - Repo-specific references? (8+ mentions)
#    - Creative skill names? (not "refactor-code")
#    - Concrete SKILL.md drafts? (3+ complete examples)
#    - Actionable next steps? (git commands, file paths)
Success criteria: 8+/10 creativity score across 3 test runs

5. DEPLOY & AUTOMATE
text
✅ Branch: `refactor/templates-v2`
✅ PR with before/after diffs
✅ Add to rosetta CLI: `rosetta refactor-templates`
✅ VSCode task: "Regenerate templates on workspace open"
✅ Symlink/backup originals
Guardrails
NEVER generate generic skills ("refactor", "fix-bugs", "write-tests")

ALWAYS tie skills to specific repo signals (frameworks, tests, directories)

STOP and ask if template >250 lines or SKILL.md >120 lines

NO symlinks for IDE folders (use rosetta sync instead)

BLOCK if audit table missing Priority column

Output Expectations
text
✅ TEMPLATES-AUDIT.md (scored table)
✅ patterns.md (reusable components) 
✅ 3+ refactored templates with before/after
✅ VALIDATION.md (Copilot test results + scores)
✅ Git PR: `refactor/templates-v2`
✅ CLI command: `rosetta refactor-templates`
✅ VSCode task: "rosetta refactor-templates"
Success Metrics
Metric	Before	Target
Creativity Score	4/10	9/10
Repo References	1-2	8+
SKILL.md Completeness	40%	95%
Template Length	200+ lines	<250 lines

You can make this template much more “creative‑robust” for Copilot/Claude by adding: (1) richer roles, (2) multiple perspectives, (3) explicit patterns, and (4) examples/constraints directly into the generated markdown.

Concrete changes to your template
Here’s a revised version of the top of generateSkillIdeationTemplate that bakes in those ideas; you can splice these strings into your function:

ts
let templateContent = `# Rosetta Skill Ideation Session

You are a **Senior AI Solutions Architect** specializing in **Agentic Workflows**, **Context Engineering**, and **developer experience for IDE-integrated agents**.

You are participating in a *collaborative workshop* with me to design **1–5 high-leverage Rosetta skills** for this specific codebase.
Treat this like a product design sprint: first discover, then propose, then refine.

You ALWAYS follow this interaction loop:
1. Clarify the problem space with targeted questions.
2. Propose several options (with tradeoffs) instead of a single answer.
3. Ask for my preference or constraints.
4. Refine the chosen option into a concrete \`SKILL.md\`.

When thinking, explicitly consider at least **three lenses**:
- **Architecture lens**: module boundaries, data flow, state management, coupling.
- **Workflow lens**: repetitive tasks, handoffs between humans and agents, sources of toil.
- **Risk lens**: regressions, security/privacy, performance, onboarding new contributors.

Stay concrete, repo-aware, and opinionated. Avoid generic advice that would apply to any project.
`;
Then, before “## 🎯 Your Mission”, insert extra scaffolding that pushes creativity and structure:

ts
templateContent += `

---

## 🔍 Reasoning Modes You Can Use

When ideating skills, you may (and should) use these reasoning patterns:
- **Divergent ideation**: First generate 5–10 rough ideas without judging them.
- **Convergence**: Cluster ideas into 2–4 themes (e.g., “testing helpers”, “API contracts”, “onboarding docs”).
- **Inversion**: Ask “If we did NOT define this skill, where would things most likely go wrong?”
- **Self-critique**: For each proposed skill, list 2–3 potential failure modes or misuses.

For each serious skill proposal, explicitly answer:
- What **recurring pain** does this remove?
- What **existing artifacts** in this repo will the agent lean on? (tests, docs, config, schemas, etc.)
- How does this skill **compose** with other skills? (e.g., used before/after another skill)
`;
Make Step 1 and 2 more opinionated
Tighten Step 1 and Step 2 so Copilot/Claude has a richer pattern to follow.

Replace your Step 1 block with:

text
### Step 1: Deep Discovery (Clarifying Questions)

Start by asking me **3–7 high-impact questions**. Group them under these headings:

1. **Hotspots & Risks**
   - Ask about the messiest modules, flakiest tests, or most feared changes.
2. **Repetitive Toil**
   - Ask what I explain to AI tools again and again, or what PR comments repeat.
3. **Domain & Invariants**
   - Ask about non-obvious rules: state machines, auth rules, data integrity constraints.
4. **Agent Autonomy**
   - Ask where I would trust an agent to act with minimal supervision *if* it had the right guardrails.

Write your questions as a numbered list and wait for my answers before proposing any skills.
Then enrich Step 2:

text
### Step 2: Skill Proposals

After I answer, propose **2–5 New Rosetta Skills**.

For each skill, provide:

1. **High-Level Strategy**
   - \`name\`: kebab-case, scoped to a clear responsibility (e.g., \`backend-api-contracts\`, \`frontend-state-guardrails\`, \`test-failure-triage\`).
   - **Intent:** In 2–3 sentences, explain the recurring scenario it optimizes.
   - **Trigger:** Describe concrete triggers, e.g.:
     - "When refactoring any file under \`/src/services\` touching API calls"
     - "When adding or updating DB migrations"
     - "When triaging failing tests in CI"

2. **Implementation Spec (The \`SKILL.md\` file)**

Follow this exact pattern and keep it under ~120 lines:

\`\`\`yaml
---
name: [skill-name]
description: [One-sentence punchy value prop]
domains:
  - [frontend/backend/testing/devex/devops/etc]
---

# [Skill Name] Skill

## Intent
[What this skill aims to achieve, tied to specific repo pain points and risks.]

## Pre-Checks
- [Files / directories to scan first]
- [Signals to look for: TODOs, flaky tests, large diffs, etc.]
- [What to skip or ignore]

## Workflow
[Step-by-step SOP for the AI agent, written as imperative bullets.]
- Analyze...
- Cross-check...
- Implement...
- Run or update tests...
- Summarize decisions made...

## Guardrails
- [Behaviors that are explicitly forbidden]
- [When to stop and ask the human for confirmation]
- [How to handle ambiguity]

## Output
[Exact artifacts expected: files changed, reports, log notes, or PR descriptions.]
\`\`\`
Repo-aware creativity hooks
You’re already passing languages, frameworks, tests, etc.; use them to inject a few “smart hints” that nudge the agent into more domain-specific creativity.

For example, after the “Repository Blueprint” you can append:

ts
templateContent += `

### Auto-detected Opportunities

Based on this blueprint, explicitly consider whether we need skills for:

- **Testing discipline**: ${tests.length > 0
  ? `Strengthen or standardize ${tests.join(', ')} usage (e.g., flaky test triage, snapshot reviews, golden data).`
  : `Introduce a minimal but reliable testing workflow (e.g., smoke tests around critical paths).`}
- **Framework-specific patterns**: ${frameworks.length > 0
  ? `Enforce or document best practices for ${frameworks.join(', ')} (routing, data fetching, component patterns, etc.).`
  : `Identify implicit patterns in how modules are structured (since no major framework was detected).`}
- **Architecture guardrails**: Protect \`${primaryArchitecture || 'the core architecture'}\` from accidental erosion (e.g., leaking domain logic into UI, bypassing service layers).
- **Onboarding & docs-as-code**: Help new contributors understand conventions inside \`${projectName}\` without reading every file manually.
`;
You can do something similar with teamContext to bias skills toward that domain (e.g., “healthtech privacy rules”, “fintech auditability”).
​

How to use this with Copilot chat
When you feed the generated markdown into Copilot/Cursor/Claude, add one short top-level instruction like:

“Treat this file as your system prompt for a live workshop. Follow it literally, especially the interaction loop and the reasoning modes. Do not skip Step 1.”

That leverages Copilot’s “Goal / Context / Constraints / Examples / Output format” pattern and turns your template into a reusable, repo-aware prompt file.

