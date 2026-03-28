import inquirer from 'inquirer';
import chalk from 'chalk';
import { pathExists, copy, remove } from 'fs-extra';
import { writeFile } from 'fs/promises';
import path from 'path';
import { detectStack } from '../detectors/stack-detector.js';
import { compileStackTemplate, listAvailableStacks } from '../templates/stack-compiler.js';

const IDE_TARGETS = {
  claude: { file: 'CLAUDE.md', name: 'Claude Code' },
  cursor: { file: '.cursorrules', name: 'Cursor' },
  windsurf: { file: '.windsurfrules', name: 'Windsurf' },
};

export async function init(options = {}) {
  const { yes = false, ide: ideFlags = [], dryRun = false } = options;

  try {
    console.log(chalk.cyan('🔧 Rosetta Init - Scaffolding Agentic Config\n'));

    // Step 1: Detect stack
    console.log(chalk.gray('Detecting project stack...'));
    const detection = await detectStack();

    if (!detection.detected) {
      console.log(chalk.yellow('Could not detect project stack automatically.'));
      const stacks = await listAvailableStacks();

      const { selectedStack } = !yes ? await inquirer.prompt([{
        type: 'list',
        name: 'selectedStack',
        message: 'Select your project stack:',
        choices: stacks,
      }]) : { selectedStack: stacks[0] };

      detection.stack = selectedStack;
    } else {
      console.log(chalk.green(`Detected: ${detection.stack} (${detection.confidence} confidence)`));

      if (!yes) {
        const { confirmed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirmed',
          message: 'Is this correct?',
          default: true,
        }]);

        if (!confirmed) {
          const stacks = await listAvailableStacks();
          const { selectedStack } = await inquirer.prompt([{
            type: 'list',
            name: 'selectedStack',
            message: 'Select your project stack:',
            choices: stacks,
          }]);
          detection.stack = selectedStack;
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
      const { ides } = await inquirer.prompt([{
        type: 'checkbox',
        name: 'ides',
        message: 'Select IDEs to generate configs for:',
        choices: ideChoices,
        default: ['claude'],
      }]);
      selectedIDEs = ides;
    } else if (ideFlags.length === 0) {
      selectedIDEs = ['claude'];
    }

    // Step 3: Gather project info
    let projectName = detection.evidence?.scripts?.name || path.basename(process.cwd());
    if (!yes) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: projectName,
        },
        {
          type: 'input',
          name: 'language',
          message: 'Primary language:',
          default: detection.language || 'typescript',
        },
        {
          type: 'input',
          name: 'testRunner',
          message: 'Test runner:',
          default: detection.testRunner || 'jest',
        },
      ]);
      projectName = answers.projectName;
      detection.language = answers.language;
      detection.testRunner = answers.testRunner;
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

      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: [
          { name: 'Backup and overwrite', value: 'backup' },
          { name: 'Skip existing files', value: 'skip' },
          { name: 'Cancel', value: 'cancel' },
        ],
      }]);

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

    // Step 5: Generate files
    const context = {
      projectName,
      language: detection.language,
      framework: detection.framework,
      testRunner: detection.testRunner,
      linter: detection.linter,
      formatter: detection.formatter,
      buildTool: detection.buildTool,
    };

    const generatedFiles = [];

    for (const ide of selectedIDEs) {
      const targetFile = IDE_TARGETS[ide].file;
      const content = await compileStackTemplate(detection.stack, ide, context);

      if (dryRun) {
        console.log(chalk.cyan(`\nWould generate ${targetFile}:`));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(content);
        console.log(chalk.gray('─'.repeat(50)));
      } else {
        await writeFile(targetFile, content, 'utf-8');
        console.log(chalk.green(`✓ Generated ${targetFile}`));
        generatedFiles.push(targetFile);
      }
    }

    if (dryRun) {
      console.log(chalk.cyan('\nDry run complete. No files written.'));
      return { success: true, dryRun: true };
    }

    // Step 6: Run audit validation (skipped for now since audit command doesn't exist)
    console.log(chalk.cyan('\nSkipping audit validation (audit command not implemented)'));

    console.log(chalk.green('\n✓ Init complete!'));
    console.log(chalk.gray(`Generated ${generatedFiles.length} file(s).`));

    return { success: true, generatedFiles };

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    return { success: false, error: err.message };
  }
}