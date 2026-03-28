import inquirer from 'inquirer';

/**
 * Prompt for file overwrite action
 */
export async function promptOverwrite(filename) {
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: `File ${filename} already exists. What would you like to do?`,
    choices: [
      { name: 'Backup and overwrite', value: 'backup' },
      { name: 'Skip this file', value: 'skip' },
      { name: 'Cancel', value: 'cancel' },
    ],
    default: 'backup',
  }]);
  return action;
}

/**
 * Prompt for IDE selection with auto-detected pre-selected
 */
export async function promptIDESelection(detectedIDEs = []) {
  const choices = [
    { name: 'Claude Code', value: 'claude', checked: detectedIDEs.includes('claude') },
    { name: 'Cursor', value: 'cursor', checked: detectedIDEs.includes('cursor') },
    { name: 'Windsurf', value: 'windsurf', checked: detectedIDEs.includes('windsurf') },
  ];

  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'Select IDEs to generate configs for:',
    choices,
    default: detectedIDEs.length > 0 ? detectedIDEs : ['claude'],
  }]);
  return ides;
}

/**
 * Prompt for stack selection
 */
export async function promptStackSelection(stacks, defaultStack) {
  const { stack } = await inquirer.prompt([{
    type: 'list',
    name: 'stack',
    message: 'Select your project stack:',
    choices: stacks,
    default: defaultStack,
  }]);
  return stack;
}