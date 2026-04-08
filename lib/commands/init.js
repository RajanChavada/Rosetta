import { input, confirm, checkbox, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { pathExists, copy, ensureDir } from 'fs-extra';
import { writeFile } from 'fs/promises';
import path from 'path';
import { detectStack } from '../detectors/stack-detector.js';
import { compileStackTemplate, listAvailableStacks } from '../templates/stack-compiler.js';
import { renderNamedTemplate } from '../templates.js';
import { auditAllTemplates, generateAuditReport } from './audit.js';

const IDE_TARGETS = {
  claude: {
    file: 'CLAUDE.md',
    name: 'VS Code / Claude Code',
    output: 'stack',
    templateIde: 'claude',
    aliases: ['claude', 'claude-code', 'vscode', 'vs-code']
  },
  cursor: {
    file: '.cursorrules',
    name: 'Cursor',
    output: 'stack',
    templateIde: 'cursor',
    aliases: ['cursor']
  },
  windsurf: {
    file: '.windsurf/rules/rosetta-rules.md',
    name: 'Windsurf',
    output: 'stack',
    templateIde: 'windsurf',
    aliases: ['windsurf']
  },
  copilot: {
    file: '.github/copilot-instructions.md',
    name: 'GitHub Copilot',
    output: 'template',
    template: 'copilot-instructions.md',
    aliases: ['copilot', 'github-copilot']
  },
  antigravity: {
    file: '.agent/skills/project-skill.md',
    name: 'Antigravity',
    output: 'template',
    template: 'antigravity-skill.md',
    aliases: ['antigravity']
  },
  replit: {
    file: 'replit.md',
    name: 'Replit',
    output: 'template',
    template: 'replit.md',
    aliases: ['replit']
  },
};

const STACK_DEFAULTS = {
  'next.js': {
    language: 'typescript',
    framework: 'next.js',
    testRunner: 'jest',
    linter: 'eslint',
    formatter: 'prettier',
    buildTool: 'next'
  },
  'react-vite': {
    language: 'typescript',
    framework: 'react',
    testRunner: 'vitest',
    linter: 'eslint',
    formatter: 'prettier',
    buildTool: 'vite'
  },
  'node-api': {
    language: 'typescript',
    framework: 'node.js API',
    testRunner: 'jest',
    linter: 'eslint',
    formatter: 'prettier',
    buildTool: 'node'
  },
  'python-fastapi': {
    language: 'python',
    framework: 'fastapi',
    testRunner: 'pytest',
    linter: 'ruff',
    formatter: 'black',
    buildTool: 'uvicorn'
  },
  'swift-ios': {
    language: 'swift',
    framework: 'swiftui',
    testRunner: 'xctest',
    linter: 'swiftlint',
    formatter: 'swiftformat',
    buildTool: 'xcodebuild'
  }
};

function createManualDetection(detection, stack) {
  return {
    ...detection,
    ...(STACK_DEFAULTS[stack] || {}),
    detected: true,
    confidence: 'manual',
    stack
  };
}

function fillDetectedStackDefaults(detection) {
  if (!detection?.stack) {
    return detection;
  }

  return {
    ...(STACK_DEFAULTS[detection.stack] || {}),
    ...detection,
    detected: true,
    stack: detection.stack
  };
}

function normalizeIdeFlags(ideFlags = []) {
  const requested = Array.isArray(ideFlags)
    ? ideFlags
    : [ideFlags].filter(Boolean);

  const normalized = [];

  for (const ide of requested) {
    const input = String(ide).trim().toLowerCase();
    const match = Object.entries(IDE_TARGETS).find(([key, target]) =>
      key === input || target.aliases.includes(input)
    );

    if (!match) {
      const supported = Object.entries(IDE_TARGETS)
        .map(([key, target]) => `${key} (${target.name})`)
        .join(', ');
      throw new Error(`Unsupported IDE "${ide}". Supported IDEs: ${supported}`);
    }

    const [canonicalIde] = match;
    if (!normalized.includes(canonicalIde)) {
      normalized.push(canonicalIde);
    }
  }

  return normalized;
}

function buildWrapperTemplateContext(projectName, detection) {
  const frontend = [];
  const backend = [];
  let projectType = 'software project';

  switch (detection.stack) {
    case 'next.js':
      frontend.push('next.js');
      backend.push('next.js');
      projectType = 'full-stack web application';
      break;
    case 'react-vite':
      frontend.push('react', 'vite');
      projectType = 'frontend web application';
      break;
    case 'node-api':
      backend.push('node.js API');
      projectType = 'backend API';
      break;
    case 'python-fastapi':
      backend.push('fastapi');
      projectType = 'backend API';
      break;
    case 'swift-ios':
      frontend.push('swift', 'ios');
      projectType = 'mobile application';
      break;
    default:
      if (detection.framework) {
        backend.push(detection.framework);
      }
  }

  return {
    projectName,
    projectType,
    frontend,
    backend,
    domainTags: [detection.language, detection.framework, detection.stack].filter(Boolean),
    testingSetup: detection.testRunner || 'Unit tests',
    riskLevel: 'Medium',
    editPermissions: 'Multiple files in same module'
  };
}

export async function init(options = {}) {
  const {
    yes = false,
    ide: rawIdeFlags = [],
    dryRun = false,
    stack: stackFlag
  } = options;
  const ideFlags = normalizeIdeFlags(rawIdeFlags);

  try {
    console.log(chalk.cyan('🔧 Rosetta Init - Scaffolding Agentic Config\n'));

    // Step 1: Detect stack
    console.log(chalk.gray('Detecting project stack...'));
    let detection = await detectStack();
    const stacks = await listAvailableStacks();
    const stackChoices = new Map(stacks.map((stack) => [stack.value.toLowerCase(), stack.value]));

    if (stackFlag) {
      const requestedStack = stackChoices.get(String(stackFlag).trim().toLowerCase());
      if (!requestedStack) {
        const availableStacks = stacks.map(stack => stack.value).join(', ');
        throw new Error(`Unknown stack "${stackFlag}". Available stacks: ${availableStacks}`);
      }

      const detectedStack = detection.stack;
      detection = createManualDetection(detection, requestedStack);

      if (detectedStack && detectedStack !== requestedStack) {
        console.log(chalk.yellow(`Detected ${detectedStack}, but using requested stack ${requestedStack}.`));
      } else {
        console.log(chalk.green(`Using requested stack: ${requestedStack}`));
      }
    } else if (!detection.detected) {
      console.log(chalk.yellow('Could not detect project stack automatically.'));

      if (stacks.length === 0) {
        throw new Error(
          'No stack templates available. Please ensure the templates directory exists and contains valid stack templates.'
        );
      }

      const selectedStack = !yes ? await select({
        message: 'Select your project stack:',
        choices: stacks,
      }) : stacks[0]?.value;

      if (!selectedStack) {
        throw new Error('No stack selected. Please select a valid project stack.');
      }

      detection = createManualDetection(detection, selectedStack);
    } else {
      detection = fillDetectedStackDefaults(detection);
      console.log(chalk.green(`Detected: ${detection.stack} (${detection.confidence} confidence)`));

      if (!yes) {
        const confirmed = await confirm({
          message: 'Is this correct?',
          default: true,
        });

        if (!confirmed) {
          const stacks = await listAvailableStacks();
          if (stacks.length === 0) {
            throw new Error(
              'No stack templates available. Please ensure the templates directory exists and contains valid stack templates.'
            );
          }
          const selectedStack = await select({
            message: 'Select your project stack:',
            choices: stacks,
          });
          if (!selectedStack) {
            throw new Error('No stack selected. Please select a valid project stack.');
          }
          detection = createManualDetection(detection, selectedStack);
        }
      }
    }

    // Step 2: Select IDEs
    const ideChoices = Object.entries(IDE_TARGETS).map(([key, { name }]) => ({
      name,
      value: key,
      checked: ideFlags.length === 0 || ideFlags.includes(key),
    }));

    let selectedIDEs = ideFlags;
    if (ideFlags.length === 0 && !yes) {
      selectedIDEs = await checkbox({
        message: 'Select IDEs to generate configs for:',
        choices: ideChoices,
        default: ['claude'],
      });
    } else if (ideFlags.length === 0) {
      selectedIDEs = ['claude'];
    }

    // Step 3: Gather project info
    let projectName = detection.evidence?.scripts?.name || path.basename(process.cwd());
    if (!yes) {
      projectName = await input({
        message: 'Project name:',
        default: projectName,
      });
      detection.language = await input({
        message: 'Primary language:',
        default: detection.language || 'typescript',
      });
      detection.testRunner = await input({
        message: 'Test runner:',
        default: detection.testRunner || 'jest',
      });
    }

    // Step 4: Check existing files
    const existingFiles = [];
    for (const ide of selectedIDEs) {
      const targetFile = IDE_TARGETS[ide].file;
      if (await pathExists(targetFile)) {
        existingFiles.push({ ide, file: targetFile });
      }
    }

    if (existingFiles.length > 0 && !yes) {
      console.log(chalk.yellow('\nExisting config files detected:'));
      for (const { file } of existingFiles) {
        console.log(chalk.gray(`  - ${file}`));
      }

      const action = await select({
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Backup and overwrite', value: 'backup' },
          { name: 'Skip existing files', value: 'skip' },
          { name: 'Cancel', value: 'cancel' },
        ],
      });

      if (action === 'cancel') {
        console.log(chalk.gray('Init cancelled.'));
        return { success: false, cancelled: true };
      }

      if (action === 'backup') {
        for (const { file } of existingFiles) {
          await copy(file, `${file}.bak`);
          console.log(chalk.gray(`Backed up ${file} to ${file}.bak`));
        }
      } else {
        // Skip existing - filter them out
        for (const { ide } of existingFiles) {
          const idx = selectedIDEs.indexOf(ide);
          if (idx > -1) selectedIDEs.splice(idx, 1);
        }
      }
    }

    const wrapperContext = buildWrapperTemplateContext(projectName, detection);
    const context = {
      projectName,
      projectType: wrapperContext.projectType,
      language: detection.language,
      framework: detection.framework,
      testRunner: detection.testRunner,
      linter: detection.linter,
      formatter: detection.formatter,
      buildTool: detection.buildTool,
      devCommand: detection.evidence?.scripts?.dev,
      buildCommand: detection.evidence?.scripts?.build,
      testCommand: detection.evidence?.scripts?.test,
    };

    if (!detection.stack) {
      throw new Error('Could not detect project stack automatically.');
    }

    const generatedFiles = [];

    for (const ide of selectedIDEs) {
      const target = IDE_TARGETS[ide];
      const targetFile = target.file;
      const content = target.output === 'stack'
        ? await compileStackTemplate(detection.stack, target.templateIde, context)
        : await renderNamedTemplate(target.template, wrapperContext);

      if (dryRun) {
        console.log(chalk.cyan(`\nWould generate ${targetFile}:`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(50)));
      } else {
        await ensureDir(path.dirname(targetFile));
        await writeFile(targetFile, content, 'utf-8');
        console.log(chalk.green(`✓ Generated ${targetFile}`));
        generatedFiles.push(targetFile);
      }
    }

    if (dryRun) {
      console.log(chalk.cyan('\nDry run complete. No files written.'));
      return { success: true, dryRun: true };
    }

    // Step 6: Run audit validation
    console.log(chalk.cyan('\nRunning audit validation...'));
    try {
      const results = await auditAllTemplates();
      const report = generateAuditReport(results);

      if (report.summary.failed === 0) {
        console.log(chalk.green('✅ All templates passed audit validation'));
      } else {
        console.log(chalk.yellow('⚠️  Some templates failed audit validation'));
      }
    } catch (err) {
      console.log(chalk.gray(`Audit validation skipped: ${err.message}`));
    }

    console.log(chalk.green('\n✓ Init complete!'));
    console.log(chalk.gray(`Generated ${generatedFiles.length} file(s).`));

    return { success: true, generatedFiles };

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    throw err;
  }
}
