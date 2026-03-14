# Subagents

This document describes the subagent system in Rosetta for delegating heavy exploration and analysis tasks.

## Overview

Rosetta includes a subagent system that allows you to delegate specific types of work to specialized agents. Subagents are particularly useful for:

- Large codebase exploration tasks
- Finding specific patterns or functions across multiple files
- Security reviews requiring dependency analysis
- Reducing main context usage for heavy operations

Subagents run as separate processes with their own context limits, allowing you to explore complex areas of the codebase without exhausting the main session's context.

## Available Subagents

### explore-codebase

**Purpose:** Scan repository, map important files and patterns, and provide concise summaries.

**When to use:**
- Exploring unfamiliar areas of the codebase
- Finding where specific functions or classes are defined
- Understanding relationships between modules
- Locating files related to a particular feature
- Mapping out code structure before making changes

**What it does:**
- Uses Glob to find relevant files by pattern
- Reads targeted files to understand structure
- Searches for specific function/class names with Grep
- Identifies import/usage patterns between modules
- Generates concise summary with file paths and hotspots

**Output format:**
```text
# Exploration: <topic>

Files Found:
- lib/context.js - Context gathering, auto-detection
- lib/templates.js - Template rendering and file ops

Key Patterns:
- All modules use ES6 import/export
- Async/await pattern used throughout
- Error handling uses try/catch with chalk-red

Relationships:
- lib/context.js → lib/constants.js
- lib/templates.js → lib/utils.js

Hotspots:
- cli.js: Main entry point, all command registration
- lib/context.js: Auto-detection logic
```

**Example usage:**
```bash
# Invoke from Rosetta CLI
rosetta agent explore-codebase --find "renderTemplate function"
rosetta agent explore-codebase --scan lib/
rosetta agent explore-codebase --pattern "async function"
```

### security-review

**Purpose:** Scan repository for security issues and dependency risks without modifying files.

**When to use:**
- Adding new dependencies to the project
- Making security-sensitive changes
- During audit or review phases
- Before releasing a new version
- When compliance requires security review

**What it does:**
- Identifies package manager (npm, pip, go modules, cargo)
- Runs appropriate audit command in read-only mode
- Parses output for known vulnerabilities
- Searches for hardcoded secrets, API keys, tokens
- Checks for unsafe patterns (eval(), dangerous imports)
- Reviews file permissions on configuration files
- Provides findings with file paths and remediation suggestions

**Output format:**
```text
# Security Review: <component>

Dependencies:
- lodash@4.17.21: Prototype pollution vulnerability (CVE-2021-23337)
- axios@0.19.0: Multiple SSRF vulnerabilities

Code Issues:
- lib/config.js:23 - API key hardcoded in source
- lib/utils.js:45 - Uses eval() with user input

Configuration:
- .rosetta.json: File permissions too permissive (644)
- ~/.rosetta/config.json: OK (600)

Remediations:
- 1. Update lodash to 4.17.21 or later
- 2. Move API key to environment variable
- 3. Replace eval() with safer alternative
- 4. Set .rosetta.json to 600
```

**Example usage:**
```bash
# Invoke from Rosetta CLI
rosetta agent security-review
rosetta agent security-review --dependencies
rosetta agent security-review --scan lib/ai-client.js
```

**Security patterns checked:**

| Pattern | Risk | Example |
|---------|-------|---------|
| Hardcoded API keys | Critical | `apiKey = "sk-..."` |
| Token in source | Critical | `token = process.env.TOKEN` then use token |
| eval/exec | High | `eval(userInput)` |
| Unsafe imports | Medium | `import { exec } from 'child_process'` |
| Weak passwords | Medium | Default passwords in config |

## Creating New Subagents

Subagents are defined as markdown files in `.claude/agents/`. Each agent file contains:

1. **Purpose statement** - What the agent does
2. **Scope** - What tasks it handles
3. **Allowed tools** - Which tools the agent can use
4. **Workflow** - Step-by-step process the agent follows
5. **Output format** - Expected output structure
6. **Constraints** - Limitations and rules the agent must follow
7. **Example usage** - Sample invocations

### Example Agent File Structure

```markdown
# Agent Name

**Purpose:** Brief description of what this agent does.

## Scope

This agent handles:
- Task type 1
- Task type 2
- Task type 3

## Allowed Tools

- **Read:** Read file contents
- **Grep:** Search for patterns
- **Bash:** Execute read-only commands

## Workflow

1. **Step 1:** Description of first step
2. **Step 2:** Description of second step
3. **Step 3:** Description of third step

## Output Format

```text
# Output Title

Section 1:
- Item 1
- Item 2

Section 2:
- Item 1
```

## Constraints

- Limitation 1
- Limitation 2
- Limitation 3

## Example Usage

```bash
rosetta agent agent-name --option value
```
```

### Registering a New Subagent

After creating the agent file, register it in `lib/subagents.js`:

```javascript
export const SUBAGENTS = {
  'explore-codebase': {
    name: 'Explore Codebase',
    file: '.claude/agents/explore-codebase.md',
    description: 'Scan repository, map patterns, find files',
    timeout: 60000
  },
  'security-review': {
    name: 'Security Review',
    file: '.claude/agents/security-review.md',
    description: 'Security scanning, dependency audit (read-only)',
    timeout: 30000
  },
  // Add your new agent here
  'your-agent': {
    name: 'Your Agent Display Name',
    file: '.claude/agents/your-agent.md',
    description: 'Brief description of what your agent does',
    timeout: 30000 // milliseconds
  }
};
```

## Commands Reference

### `rosetta agent <name>`

Invoke a specific subagent.

```bash
rosetta agent explore-codebase --find "renderTemplate"
rosetta agent security-review --dependencies
```

Options vary by agent. Use `rosetta agent <name> --help` for agent-specific options.

### `rosetta agents`

List all available subagents.

```bash
rosetta agents
```

Output:
```
Available Subagents:

  explore-codebase   Scan repository, map patterns, find files
  security-review    Security scanning, dependency audit (read-only)
```

## Best Practices

### When to Delegate vs Do Yourself

| Situation | Delegate | Do Yourself |
|-----------|----------|-------------|
| Find specific function in 1 file | No | Yes |
| Map patterns across 3+ files | Yes | No |
| Review dependency security | Yes | No |
| Simple grep search | No | Yes |
| Explore unfamiliar codebase area | Yes | No |
| Make a specific code change | No | Yes |
| Audit for security issues | Yes | No |
| Read a single file | No | Yes |

### Delegation Workflow

1. **Define the task:** Clearly specify what you need from the subagent
2. **Invoke with focused prompt:** Include specific constraints if needed
3. **Review the output:** Check the summary and file paths provided
4. **Update PLAN.md:** Add findings to your session plan if relevant
5. **Continue with main work:** Use the subagent's findings to inform your work

### Tips for Effective Delegation

- **Be specific:** Include file patterns, search terms, or specific areas to focus on
- **Set constraints:** Limit search scope to relevant directories if possible
- **Review hotspots:** Subagents highlight key files - prioritize these for main work
- **Update state:** Add findings to PLAN.md Decisions or Active Tasks as needed
- **Use repeatedly:** Subagents are fast - run them multiple times for different queries

### When Context Approaches Capacity

Delegating to a subagent is a good strategy when:
- Main context is at 60-70% capacity
- You need to explore a large new area
- The task requires scanning many files
- You want to preserve context for implementation

The subagent runs in a separate process with its own context, so it won't impact your main session's context limit.

## Subagent Constraints

All subagents must follow these constraints:

- **Read-only for security review:** Never modify files, only report findings
- **Concise output:** Keep output under 100 lines for exploration, 80 for security review
- **Stay in scope:** Only work within the specified directory/project
- **No verbose logs:** Don't print full command output, just findings
- **Recommend only:** Provide suggestions, do not implement changes

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project configuration with subagent workflow
- [SESSIONS.md](SESSIONS.md) - Session management and handoff
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture overview
