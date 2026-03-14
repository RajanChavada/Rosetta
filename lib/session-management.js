import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TreeLogger } from './utils.js';

const PLAN_FILE = 'PLAN.md';
const TODO_FILE = 'TODO.md';
const CLAUDE_FILE = 'CLAUDE.md';
const MAX_SUMMARY_LINES = 10;

/**
 * Load PLAN.md contents.
 */
export async function loadPlan() {
  if (!(await fs.pathExists(PLAN_FILE))) {
    console.log(chalk.yellow(`Plan file not found: ${PLAN_FILE}`));
    return null;
  }

  const content = await fs.readFile(PLAN_FILE, 'utf8');
  return parsePlan(content);
}

/**
 * Parse PLAN.md content into structured object.
 */
function parsePlan(content) {
  const plan = {
    goals: [],
    activeTasks: [],
    decisions: [],
    sessionHandoff: null
  };

  let currentSection = null;

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim().toLowerCase();
    } else if (currentSection === 'goals') {
      const match = line.match(/^\- \[([ x])\]\s+(.+)/);
      if (match) {
        plan.goals.push({ text: match[2], checked: match[1] === 'x' });
      }
    } else if (currentSection === 'active tasks') {
      const match = line.match(/^\- \[([ x])\]\s+(.+)/);
      if (match) {
        plan.activeTasks.push({ text: match[2], checked: match[1] === 'x' });
      }
    } else if (currentSection === 'decisions') {
      if (line.startsWith('- **')) {
        const dateMatch = line.match(/\*\*(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
        const text = line.replace(/^- \*\*\d{4}-\d{2}-\d{2}\s+-\s+/, '').trim();
        plan.decisions.push({ date, text });
      }
    } else if (currentSection === 'session handoff') {
      plan.sessionHandoff = line.trim();
    }
  }

  return plan;
}

/**
 * Update PLAN.md with new content.
 */
export async function savePlan(plan) {
  const content = generatePlanContent(plan);
  await fs.writeFile(PLAN_FILE, content);
}

/**
 * Generate PLAN.md content from structured plan.
 */
function generatePlanContent(plan) {
  let output = '# Rosetta Development Plan\n\n';
  output += '## Goals\n\n';

  for (const goal of plan.goals) {
    const checkbox = goal.checked ? '[x]' : '[ ]';
    output += `${checkbox} ${goal.text}\n`;
  }

  output += '\n## Active Tasks\n\n';

  for (const task of plan.activeTasks) {
    const checkbox = task.checked ? '[x]' : '[ ]';
    output += `${checkbox} ${task.text}\n`;
  }

  output += '\n## Decisions\n\n';

  for (const decision of plan.decisions) {
    output += `- **${decision.date} - ${decision.text}\n`;
  }

  output += '\n## Session Handoff\n\n';
  output += plan.sessionHandoff || 'No session handoff information.\n';

  return output;
}

/**
 * Display current plan.
 */
export function displayPlan(plan) {
  console.log(chalk.blue.bold('\\n📋 Current Plan\\n'));

  if (plan.goals.length > 0) {
    console.log(chalk.cyan('Goals:'));
    for (const goal of plan.goals) {
      const status = goal.checked ? chalk.green('[✓]') : chalk.gray('[ ]');
      console.log(`  ${status} ${goal.text}`);
    }
  }

  if (plan.activeTasks.length > 0) {
    console.log(chalk.cyan('\\nActive Tasks:'));
    for (const task of plan.activeTasks) {
      const status = task.checked ? chalk.green('[✓]') : chalk.yellow('[ ]');
      console.log(`  ${status} ${task.text}`);
    }
  }

  if (plan.sessionHandoff) {
    console.log(chalk.cyan('\\nSession Handoff:'));
    console.log(chalk.gray(`  ${plan.sessionHandoff}`));
  }
}

/**
 * Edit plan interactively.
 */
export async function editPlan() {
  const plan = await loadPlan();
  if (!plan) return;

  console.log(chalk.blue.bold('\\n✏️ Edit Plan\\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'goals', message: 'Edit goals' },
        { name: 'tasks', message: 'Edit active tasks' },
        { name: 'add', message: 'Add new item' },
        { name: 'handoff', message: 'Update session handoff' }
      ]
    }
  ]);

  switch (action) {
    case 'goals':
      await editGoals(plan);
      break;
    case 'tasks':
      await editTasks(plan);
      break;
    case 'add':
      await addPlanItem(plan);
      break;
    case 'handoff':
      await updateHandoff(plan);
      break;
  }

  await savePlan(plan);
  console.log(chalk.green('\\n✓ Plan updated.\\n'));
}

async function editGoals(plan) {
  const { items } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'items',
      message: 'Toggle goals (select to mark complete):',
      choices: plan.goals.map(g => ({
        name: g.text,
        checked: g.checked,
        short: g.text
      })),
      default: plan.goals.filter(g => g.checked).map(g => g.text)
    }
  ]);

  for (const item of items) {
    const goal = plan.goals.find(g => g.text === item);
    if (goal) goal.checked = items.includes(item);
  }
}

async function editTasks(plan) {
  const { items } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'items',
      message: 'Toggle tasks (select to mark complete):',
      choices: plan.activeTasks.map(t => ({
        name: t.text,
        checked: t.checked,
        short: t.text
      })),
      default: plan.activeTasks.filter(t => t.checked).map(t => t.text)
    }
  ]);

  for (const item of items) {
    const task = plan.activeTasks.find(t => t.text === item);
    if (task) task.checked = items.includes(item);
  }
}

async function addPlanItem(plan) {
  const { section, text } = await inquirer.prompt([
    {
      type: 'list',
      name: 'section',
      message: 'Add to:',
      choices: ['Goals', 'Active Tasks']
    },
    {
      type: 'input',
      name: 'text',
      message: 'Item text:',
      validate: input => input.trim().length > 0
    }
  ]);

  if (section === 'Goals') {
    plan.goals.push({ text, checked: false });
  } else {
    plan.activeTasks.push({ text, checked: false });
  }
}

async function updateHandoff(plan) {
  const { handoff } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'handoff',
      message: 'Edit session handoff information:',
      default: plan.sessionHandoff || ''
    }
  ]);

  plan.sessionHandoff = handoff;
}

/**
 * Load TODO.md contents.
 */
export async function loadTodo() {
  if (!(await fs.pathExists(TODO_FILE))) {
    console.log(chalk.yellow(`TODO file not found: ${TODO_FILE}`));
    return [];
  }

  const content = await fs.readFile(TODO_FILE, 'utf8');
  return parseTodo(content);
}

/**
 * Parse TODO.md content.
 */
function parseTodo(content) {
  const todos = [];
  let currentCategory = '';

  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '');
    } else if (line.match(/^- \[([ x])\]/)) {
      const match = line.match(/^- \[([ x])\]\s+(.+)/);
      if (match) {
        todos.push({
          category: currentCategory,
          text: match[2],
          checked: match[1] === 'x'
        });
      }
    }
  }

  return todos;
}

/**
 * Save TODO.md with new content.
 */
export async function saveTodo(todos) {
  const content = generateTodoContent(todos);
  await fs.writeFile(TODO_FILE, content);
}

/**
 * Generate TODO.md content.
 */
function generateTodoContent(todos) {
  let output = '# Rosetta TODO\n\n';
  let currentCategory = '';

  for (const todo of todos) {
    if (todo.category && todo.category !== currentCategory) {
      output += `\n## ${todo.category}\n\n`;
      currentCategory = todo.category;
    }
    const checkbox = todo.checked ? '[x]' : '[ ]';
    output += `${checkbox} ${todo.text}\n`;
  }

  return output;
}

/**
 * Display current TODO.
 */
export function displayTodo(todos) {
  if (todos.length === 0) {
    console.log(chalk.gray('\\nNo TODO items.\\n'));
    return;
  }

  console.log(chalk.blue.bold('\\n✅ TODO List\\n'));

  let currentCategory = '';
  for (const todo of todos) {
    if (todo.category && todo.category !== currentCategory) {
      console.log(chalk.cyan(`\n## ${todo.category}\\n`));
      currentCategory = todo.category;
    }
    const checkbox = todo.checked ? chalk.green('[✓]') : chalk.gray('[ ]');
    console.log(`  ${checkbox} ${todo.text}`);
  }
}

/**
 * Edit TODO interactively.
 */
export async function editTodo() {
  const todos = await loadTodo();
  if (todos.length === 0) {
    console.log(chalk.yellow('No TODO items to edit.'));
    return;
  }

  console.log(chalk.blue.bold('\\n✏️ Edit TODO\\n'));

  const { items } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'items',
      message: 'Toggle items (select to complete):',
      choices: todos.map(t => ({
        name: t.text,
        checked: t.checked,
        short: t.text,
        value: t.text
      })),
      default: todos.filter(t => t.checked).map(t => t.text)
    }
  ]);

  // Update checked state
  for (const todo of todos) {
    todo.checked = items.includes(todo.text);
  }

  await saveTodo(todos);
  console.log(chalk.green('\\n✓ TODO updated.\\n'));
}

/**
 * Compaction: Summarize session into PLAN.md.
 */
export async function compactSession(workArea, compactedSkills) {
  const logger = new TreeLogger('Compacting session...');

  // Load current plan
  const plan = await loadPlan();
  if (!plan) {
    logger.logStep('No plan to update', '⚠');
    return;
  }

  // Generate session handoff
  const today = new Date().toISOString().split('T')[0];
  const handoffText = `${today} Session Compaction\n\n`;
  handoffText += `Work Area: ${workArea}\n`;
  handoffText += `Skills Loaded: ${compactedSkills.length > 0 ? compactedSkills.map(s => s.name).join(', ') : 'None'}\n`;
  handoffText += `Context at ~${estimateContextUsage()}% - Compacted and preserved.`;

  plan.sessionHandoff = handoffText;

  await savePlan(plan);
  logger.logStep('Session handoff updated', '✓', true);

  console.log(chalk.gray('\\nRun `/compact` when context approaches 60–70% to preserve active files.\\n'));
}

/**
 * Estimate current context usage.
 */
function estimateContextUsage() {
  const os = require('os');
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return Math.round((used / total) * 100);
}
