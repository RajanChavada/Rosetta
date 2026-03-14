import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

/**
 * Claude Code skills-based context loading system.
 * Loads focused documentation from .claude/skills/ based on work area.
 */

const SKILLS_DIR = '.claude/skills';

/**
 * Load a specific Claude Code skill file.
 */
export async function loadSkill(skillName) {
  const skillPath = path.join(SKILLS_DIR, `${skillName}.md`);

  if (!(await fs.pathExists(skillPath))) {
    console.log(chalk.yellow(`Skill not found: ${skillPath}`));
    return null;
  }

  return await fs.readFile(skillPath, 'utf8');
}

/**
 * Load multiple Claude Code skills by category.
 */
export async function loadSkillsByCategory(category) {
  const skills = ['frontend', 'backend', 'testing'];
  const categorySkills = {};

  for (const skill of skills) {
    const content = await loadSkill(`${category}-context`);
    if (content) {
      categorySkills[skill] = content;
    }
  }

  return categorySkills;
}

/**
 * Load all available Claude Code skills.
 */
export async function loadAllSkills() {
  const files = await fs.readdir(SKILLS_DIR);
  const skills = {};

  for (const file of files) {
    if (file.endsWith('.md') && file !== 'README.md') {
      const name = file.replace('.md', '');
      skills[name] = await loadSkill(name);
    }
  }

  return skills;
}

/**
 * Summarize Claude Code skills for active workspace.
 * Used when loading skills into context.
 */
export function summarizeSkills(loadedSkills) {
  const summary = [];

  for (const [name, content] of Object.entries(loadedSkills)) {
    // Extract key sections from skill
    const filesToConsult = extractFilesToConsult(content);
    const patterns = extractPatterns(content);

    summary.push({
      name,
      filesToConsult: filesToConsult.length > 0 ? filesToConsult.join(', ') : 'None',
      patterns: patterns.length > 0 ? patterns.slice(0, 3).join(', ') : 'None'
    });
  }

  return summary;
}

/**
 * Extract file paths from skill content.
 */
function extractFilesToConsult(content) {
  const files = [];
  const regex = /\|\s+`lib\/[^`]+`\.js`/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!files.includes(match[0])) {
      files.push(match[0]);
    }
  }

  return files;
}

/**
 * Extract key patterns from skill content.
 */
function extractPatterns(content) {
  const patterns = [];
  const patternKeywords = ['pattern', 'approach', 'guideline', 'convention'];

  for (const keyword of patternKeywords) {
    if (content.toLowerCase().includes(keyword.toLowerCase())) {
      const regex = new RegExp(`${keyword}[s:]+[:\\s]+([^.\\n]+)`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        matches.forEach(m => {
          const pattern = m.split(':')[1]?.trim();
          if (pattern && !patterns.includes(pattern)) {
            patterns.push(pattern);
          }
        });
      }
    }
  }

  return patterns;
}

/**
 * Display Claude Code skill loading summary.
 */
export function displaySkillSummary(summary) {
  if (summary.length === 0) {
    console.log(chalk.gray('No skills loaded.'));
    return;
  }

  console.log(chalk.blue.bold('\\n📚 Skills Loaded:\\n'));

  for (const skill of summary) {
    console.log(chalk.cyan(`  ${skill.name}:`));
    if (skill.filesToConsult !== 'None') {
      console.log(chalk.gray(`    Files: ${skill.filesToConsult}`));
    }
    if (skill.patterns !== 'None') {
      console.log(chalk.gray(`    Patterns: ${skill.patterns}`));
    }
  }

  console.log('');
}

/**
 * Get context enhancement from loaded Claude Code skills.
 * Merges skill summaries into context object.
 */
export function getContextEnhancement(loadedSkills, workArea) {
  const enhancement = {};

  // Select relevant skills based on work area
  const relevantSkills = Object.entries(loadedSkills).filter(([name]) =>
    workArea.includes(name)
  );

  for (const [name, content] of relevantSkills) {
    // Extract key information
    const summarySection = content.match(/## Summarization Guidelines[\\s\\S]+([\\s\\S]+)/i);
    if (summarySection) {
      const summary = summarySection[1];
      enhancement[`${name}_summary`] = summary;
    }

    // Extract files to consult
    const files = extractFilesToConsult(content);
    if (files.length > 0) {
      enhancement[`${name}_files`] = files;
    }
  }

  return enhancement;
}
