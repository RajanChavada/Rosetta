import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { detectStack } from '../detectors/stack-detector.js';
import { injectVariables } from '../templates/variable-injector.js';

const CLAUDE_MD_TEMPLATE = `# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** {{PROJECT_TYPE}}
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** {{FRAMEWORK}}
- **Testing:** {{TEST_RUNNER}}
<!-- TODO: Add more stack details -->

## Standard Operating Procedures

1. **Sync State**: Run \`rosetta sync\` before starting work
2. **Testing**: Run tests before committing
<!-- TODO: Add project-specific SOPs -->

## Conventions

<!-- TODO: Add project conventions -->

## Commands

### Development
\`\`\`bash
{{DEV_COMMAND}}
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
\`\`\`

<!-- TODO: Review and add more commands as needed -->

---

**Sections to review:**
- [ ] Project description
- [ ] Complete technology stack
- [ ] Standard operating procedures
- [ ] Project conventions
- [ ] Additional commands
`;

export async function doc(options = {}) {
  const { output = null, json = false, includeInferred = false } = options;

  try {
    // Step 1: Detect stack
    const detection = await detectStack();

    if (!detection.detected) {
      console.log(chalk.yellow('Could not detect project stack.'));
      console.log(chalk.gray('Please ensure you are in a valid project directory.'));
      return { success: false, detected: false };
    }

    // Step 2: Gather additional config
    const pkg = await fs.readJson(path.join(process.cwd(), 'package.json')).catch(() => null);

    let inferred = {
      framework: detection.framework || null,
      testRunner: detection.testRunner || null,
      linter: detection.linter || null,
      formatter: detection.formatter || null,
      buildTool: detection.buildTool || null,
    };

    // Check tsconfig for TypeScript config
    const tsconfig = await fs.readJson(path.join(process.cwd(), 'tsconfig.json')).catch(() => null);
    if (tsconfig) {
      inferred.typescript = {
        strict: tsconfig.compilerOptions?.strictMode || tsconfig.compilerOptions?.strict || false,
      };
    }

    // Check for ESLint config
    const eslintConfigs = ['.eslintrc', '.eslintrc.json', '.eslintrc.js', 'eslint.config.js'];
    for (const config of eslintConfigs) {
      if (await fs.pathExists(path.join(process.cwd(), config))) {
        inferred.hasEslintConfig = true;
        break;
      }
    }

    // Check for Prettier config
    const prettierConfigs = ['.prettierrc', '.prettierrc.json', 'prettier.config.js'];
    for (const config of prettierConfigs) {
      if (await fs.pathExists(path.join(process.cwd(), config))) {
        inferred.hasPrettierConfig = true;
        break;
      }
    }

    // Step 3: Build context for template
    const context = {
      projectName: pkg?.name || path.basename(process.cwd()),
      projectType: detection.stack === 'next.js' || detection.stack === 'react-vite' ? 'web_app' : 'api',
      language: detection.language || 'typescript',
      framework: inferred.framework || '<!-- TODO -->',
      testRunner: inferred.testRunner || '<!-- TODO -->',
      linter: inferred.linter || '<!-- TODO -->',
      formatter: inferred.formatter || '<!-- TODO -->',
      buildTool: inferred.buildTool || '<!-- TODO -->',
      devCommand: pkg?.scripts?.dev || '<!-- TODO: Add dev command -->',
      buildCommand: pkg?.scripts?.build || '<!-- TODO: Add build command -->',
      testCommand: pkg?.scripts?.test || '<!-- TODO: Add test command -->',
    };

    // Step 4: Generate output
    const content = injectVariables(CLAUDE_MD_TEMPLATE, context);

    if (json) {
      const jsonOutput = JSON.stringify({ inferred, context }, null, 2);
      if (output) {
        await fs.writeFile(output, jsonOutput, 'utf-8');
        console.log(chalk.green(`✓ Wrote ${output}`));
      } else {
        console.log(jsonOutput);
      }
      return { success: true, inferred, context };
    }

    // Default: output to stdout
    if (output) {
      await fs.writeFile(output, content, 'utf-8');
      console.log(chalk.green(`✓ Wrote ${output}`));
    } else {
      console.log(content);
    }

    if (includeInferred) {
      console.log(chalk.cyan('\n# Inferred Configuration'));
      console.log(chalk.gray(JSON.stringify(inferred, null, 2)));
    }

    return { success: true, inferred, output: content };

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    return { success: false, error: err.message };
  }
}