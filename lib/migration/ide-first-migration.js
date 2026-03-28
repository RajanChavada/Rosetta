import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadManifest, saveManifest, getAllSkills } from '../skills-manifest.js';
import { detectIdes } from '../context.js';
import {
  selectPrimaryIde,
  getIdeSkillsDir,
  getIdeManifestPath,
  ensureIdeSkillsDir,
  validateIdeLabel
} from '../ide-selection.js';
import { TARGETS } from '../constants.js';

/**
 * Analyzes the current installation structure.
 * Reports how many skills are in .rosetta/skills/ and which IDEs are configured.
 */
export async function analyzeInstallationStructure(options = {}) {
  const { isGlobal = false } = options;

  console.log(chalk.blue.bold('\n=== Rosetta Installation Analysis ===\n'));

  // Check .rosetta/skills/manifest.json
  const rosettaManifestPath = isGlobal
    ? path.join(os.homedir(), '.rosetta', 'skills', 'manifest.json')
    : path.join(process.cwd(), '.rosetta', 'skills', 'manifest.json');

  const rosettaManifestExists = await fs.pathExists(rosettaManifestPath);

  if (rosettaManifestExists) {
    try {
      const manifest = await loadManifest(rosettaManifestPath);
      const skills = getAllSkills(manifest);

      console.log(chalk.green(`Found ${skills.length} skill(s) in .rosetta/skills/:`));
      skills.forEach(skill => {
        console.log(chalk.gray(`  - ${skill.name} (${skill.scope})`));
      });
    } catch (err) {
      console.log(chalk.yellow(`Warning: Could not load .rosetta/skills/manifest.json: ${err.message}`));
    }
  } else {
    console.log(chalk.gray('No skills found in .rosetta/skills/'));
  }

  // Check IDE-specific manifests
  console.log(chalk.blue('\nIDE-specific installations:'));
  let foundIdeSkills = false;

  for (const target of TARGETS) {
    if (target.skillsDir) {
      const ideManifestPath = getIdeManifestPath(target.label, isGlobal);
      const exists = await fs.pathExists(ideManifestPath);

      if (exists) {
        try {
          const manifest = await loadManifest(ideManifestPath);
          const skills = getAllSkills(manifest);

          if (skills.length > 0) {
            console.log(chalk.green(`  ${target.label}: ${skills.length} skill(s)`));
            skills.forEach(skill => {
              console.log(chalk.gray(`    - ${skill.name}`));
            });
            foundIdeSkills = true;
          }
        } catch (err) {
          console.log(chalk.yellow(`  ${target.label}: Could not load manifest`));
        }
      }
    }
  }

  if (!foundIdeSkills) {
    console.log(chalk.gray('  No IDE-specific skills found'));
  }

  // Detect configured IDEs
  const detectedIdes = await detectIdes();
  console.log(chalk.blue('\nConfigured IDEs in project:'));
  if (detectedIdes.length > 0) {
    detectedIdes.forEach(ide => {
      console.log(chalk.green(`  - ${ide.name}`));
    });
  } else {
    console.log(chalk.gray('  No IDEs detected'));
  }

  console.log('');
}

/**
 * Migrates existing .rosetta/skills/ installations to IDE-first structure.
 * Prompts for primary IDE selection, moves skills to IDE-specific directories,
 * and updates manifests accordingly.
 */
export async function migrateToIdeFirst(options = {}) {
  const { isGlobal = false, dryRun = false } = options;

  console.log(chalk.blue.bold('\n=== IDE-First Migration ===\n'));

  // Check if .rosetta/skills/ exists
  const rosettaSkillsPath = isGlobal
    ? path.join(os.homedir(), '.rosetta', 'skills')
    : path.join(process.cwd(), '.rosetta', 'skills');

  const rosettaManifestPath = path.join(rosettaSkillsPath, 'manifest.json');
  const rosettaManifestExists = await fs.pathExists(rosettaManifestPath);

  if (!rosettaManifestExists) {
    console.log(chalk.yellow('No .rosetta/skills/ installation found. Nothing to migrate.'));
    return;
  }

  // Load the existing manifest
  const manifest = await loadManifest(rosettaManifestPath);
  const skills = getAllSkills(manifest);

  if (skills.length === 0) {
    console.log(chalk.yellow('No skills found in .rosetta/skills/. Nothing to migrate.'));
    return;
  }

  console.log(chalk.blue(`Found ${skills.length} skill(s) to migrate:\n`));
  skills.forEach(skill => {
    console.log(chalk.gray(`  - ${skill.name}`));
  });
  console.log('');

  // Prompt for primary IDE selection
  const primaryIde = await selectPrimaryIde({
    silent: false,
    allowMultiIde: false
  });

  if (!primaryIde) {
    console.log(chalk.yellow('\nMigration cancelled.'));
    return;
  }

  console.log(chalk.blue(`\nMigrating to IDE: ${primaryIde}`));

  // Validate the IDE
  const validation = validateIdeLabel(primaryIde);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Ensure the IDE's skills directory exists
  const ideSkillsDir = await ensureIdeSkillsDir(primaryIde, isGlobal, { dryRun });
  const ideManifestPath = getIdeManifestPath(primaryIde, isGlobal);

  console.log(chalk.gray(`Target directory: ${ideSkillsDir}`));
  console.log(chalk.gray(`Target manifest: ${ideManifestPath}\n`));

  if (dryRun) {
    console.log(chalk.yellow('[Dry-run] Would migrate the following skills:'));
    skills.forEach(skill => {
      console.log(chalk.gray(`  - ${skill.name}`));
    });
    return;
  }

  // Load or create the IDE manifest
  let ideManifest = await loadManifest(ideManifestPath);

  // Track migration results
  let migratedCount = 0;
  let skippedCount = 0;

  // Migrate each skill
  for (const skill of skills) {
    const sourcePath = isGlobal
      ? path.join(os.homedir(), skill.path)
      : path.join(process.cwd(), skill.path);

    const destPath = path.join(ideSkillsDir, skill.name);

    try {
      // Check if source exists
      if (!(await fs.pathExists(sourcePath))) {
        console.log(chalk.yellow(`Skipping ${skill.name}: source not found at ${sourcePath}`));
        skippedCount++;
        continue;
      }

      // Check if destination already exists
      if (await fs.pathExists(destPath)) {
        const { overwrite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: `Skill ${skill.name} already exists in ${primaryIde}. Overwrite?`,
          default: false
        }]);

        if (!overwrite) {
          console.log(chalk.yellow(`Skipping ${skill.name}`));
          skippedCount++;
          continue;
        }

        await fs.remove(destPath);
      }

      // Copy the skill directory
      await fs.copy(sourcePath, destPath);
      console.log(chalk.green(`Migrated: ${skill.name}`));

      // Update skill data with new IDE
      const migratedSkill = {
        ...skill,
        ide: primaryIde,
        path: path.join(getIdeSkillsDir(primaryIde, isGlobal).replace(process.cwd(), '').replace(os.homedir(), ''), skill.name)
      };

      // Add to IDE manifest
      ideManifest = {
        ...ideManifest,
        installed: [...ideManifest.installed, migratedSkill]
      };

      migratedCount++;
    } catch (err) {
      console.log(chalk.red(`Error migrating ${skill.name}: ${err.message}`));
      skippedCount++;
    }
  }

  // Save the IDE manifest
  await saveManifest(ideManifest, ideManifestPath);
  console.log(chalk.green(`\nSaved IDE manifest: ${ideManifestPath}`));

  // Backup the old .rosetta manifest
  const backupPath = rosettaManifestPath + '.backup';
  await fs.copy(rosettaManifestPath, backupPath);
  console.log(chalk.gray(`Backup created: ${backupPath}`));

  // Summary
  console.log(chalk.blue.bold('\n=== Migration Summary ==='));
  console.log(chalk.green(`Migrated: ${migratedCount} skill(s)`));
  console.log(chalk.yellow(`Skipped: ${skippedCount} skill(s)`));
  console.log(chalk.gray(`\nPrimary IDE: ${primaryIde}`));
  console.log(chalk.gray(`Target directory: ${ideSkillsDir}\n`));

  if (migratedCount > 0) {
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.gray(`  1. Verify skills work correctly in ${primaryIde}`));
    console.log(chalk.gray(`  2. If satisfied, remove the old .rosetta/skills/ directory`));
    console.log(chalk.gray(`  3. Use 'rosetta install --ide "${primaryIde}"' for future installs\n`));
  }
}
