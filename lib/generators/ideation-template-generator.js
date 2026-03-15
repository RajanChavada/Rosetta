import fs from 'fs-extra';
import path from 'path';

/**
 * Generates skill ideation template content based on project analysis.
 * Returns markdown content for .ai/skill-ideation-template.md.
 */
export async function generateSkillIdeationTemplate(analysisResults) {
  const {
    languages,
    frameworks,
    tests,
    directories,
    repoSize,
    primaryArchitecture,
    projectPath,
    projectName,
    ides = [],
    detailed,
    teamContext = {}
  } = analysisResults;

  // Build template content
  let templateContent = `# Rosetta Skill Ideation Session

You are an expert AI assistant integrated into my IDE (Claude Code / Cursor / etc.).
Your job is to help me design **1–5 high-leverage Rosetta skills** for this specific repo.

## Context about this project

- Project: ${projectName}
`;

  // Add languages
  if (languages.length > 0) {
    templateContent += `- Languages: ${languages.join(', ')}\n`;
  } else {
    templateContent += `- Languages: Unknown\n`;
  }

  // Add frameworks
  if (frameworks.length > 0) {
    templateContent += `- Frameworks detected: ${frameworks.join(', ')}\n`;
  } else {
    templateContent += `- Frameworks detected: None detected\n`;
  }

  // Add tests
  if (tests.length > 0) {
    templateContent += `- Tests present: ${tests.join(', ')}\n`;
  } else {
    templateContent += `- Tests present: No testing framework detected\n`;
  }

  // Add directories
  if (directories.length > 0) {
    templateContent += `- Notable directories: ${directories.slice(0, 10).join(', ')}${directories.length > 10 ? '...' : ''}\n`;
  } else {
    templateContent += `- Notable directories: Standard project structure\n`;
  }

  // Add repo size
  templateContent += `- Repo size: ${repoSize.files} files, ~${repoSize.loc.toLocaleString()} lines of code\n`;

  // Add architecture
  templateContent += `- Architecture: ${primaryArchitecture}\n`;

  // Add detected IDEs
  if (ides.length > 0) {
    templateContent += `- Detected IDEs: ${ides.map(ide => ide.name).join(', ')}\n`;
    ides.forEach(ide => {
      if (ide.skillsDir) {
        templateContent += `  - ${ide.name}: Skills folder at \`${ide.skillsDir}\`\n`;
      }
    });
  } else {
    templateContent += `- Detected IDEs: None\n`;
  }

  // Add team context if available
  if (teamContext.domain || teamContext.conventions || teamContext.existingSkills) {
    templateContent += `\n## Team Context\n`;
    if (teamContext.domain) {
      templateContent += `- Domain: ${teamContext.domain}\n`;
    }
    if (teamContext.conventions) {
      templateContent += `- Conventions: ${teamContext.conventions}\n`;
    }
    if (teamContext.existingSkills) {
      templateContent += `- Existing skills to consider: ${teamContext.existingSkills}\n`;
    }
    templateContent += `\n`;
  }

  templateContent += `

## Your task

1. Ask me 3–5 clarifying questions about:
   - My current pain points in this repo.
   - Which workflows I'd like to automate or standardize.
   - Which areas matter most (frontend, backend, testing, infra, data, etc.).

2. Based on my answers and the repo structure:
   - Propose **1–5 new Rosetta skills**.
   - For each skill, provide:
     - \`name\`
     - \`domains\` (e.g., ["backend", "testing"])
     - A 2–3 sentence description
     - When I should invoke it in my IDE agent
     - A draft \`SKILL.md\` frontmatter + instructions (YAML + Markdown).

3. Keep each skill:
   - Focused on a repeatable workflow (not a one-off command).
   - IDE/LLM-agnostic.
   - Short enough that \`SKILL.md\` stays under ~120 lines.

## Output format

When you're ready with proposals, respond with:

\`\`\`md
# Proposed Skills

## 1. <skill-name>
- Domains: [...]
- When to use: ...
- Why it matters: ...
\`\`\`yaml
---  # SKILL.md
name: ...
description: ...
domains:
  - ...
...
---
<instructions here>
\`\`\`

## Rosetta's philosophy

- The **CLI only scaffolds** files (\`CLAUDE.md\`, skills, PLAN/TODO, etc.).
- **Runtime agent behavior happens in the IDE**, using *my* LLM/API keys.
- Skills should be **IDE-agnostic**: they describe workflows and instructions, not specific API calls.
`;

  return templateContent;
}

/**
 * Writes the ideation template to a file.
 */
export async function writeIdeationTemplate(analysisResults, outputPath = '.ai/skill-ideation-template.md') {
  const templateContent = await generateSkillIdeationTemplate(analysisResults);

  // Ensure .ai directory exists
  const aiDir = path.dirname(outputPath);
  await fs.ensureDir(aiDir);

  // Write template file
  await fs.writeFile(outputPath, templateContent);

  return outputPath;
}