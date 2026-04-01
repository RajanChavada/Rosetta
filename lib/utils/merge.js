import inquirer from 'inquirer';
import { parseYAMLFile, writeYAMLFile } from '../parsers/yaml-parser.js';
import { CanonicalAST } from '../ast/canonical.js';
// import { dryRunWrite } from './cli-helpers.js';

/**
 * Merge a definition into rosetta.yaml
 * @param {string} type - Type of definition (agent, persona, workflow)
 * @param {Object} definition - The definition to merge
 * @param {string} yamlPath - Path to rosetta.yaml
 * @param {Object} options - Options
 * @returns {Promise<void>}
 */
export async function mergeDefinition(type, definition, yamlPath, options = {}) {
  const { ide, dryRun = false, force = false } = options;

  // Parse existing YAML
  const existingAST = await parseYAMLFile(yamlPath);
  const existing = existingAST.toObject();

  // Check for conflicts
  const conflict = checkConflict(type, definition, existing);

  if (conflict && !force) {
    // Prompt user for conflict resolution
    const resolution = await promptConflictResolution(type, definition, conflict);

    if (resolution === 'skip') {
      console.log(`Skipping ${type} "${definition.name || definition.type}"`);
      return;
    }

    if (resolution === 'replace') {
      // Remove existing before adding
      removeFromArray(existing, type, conflict.id);
    }

    // If merge, we'll merge the conventions
    if (resolution === 'merge' && type === 'persona') {
      mergeConventions(existing, definition);
    }
  }

  // Add definition based on type
  switch (type) {
    case 'agent':
      if (!existing.agents) existing.agents = [];
      existing.agents.push(definition);
      break;

    case 'persona':
      // Convert persona conventions to proper format and merge
      if (!existing.conventions) existing.conventions = [];

      definition.conventions.forEach(conv => {
        // Check if convention already exists
        const existingConv = existing.conventions.find(c =>
          c.name === conv || c.rules?.includes(conv)
        );

        if (!existingConv) {
          // Add as new convention object
          if (typeof conv === 'string') {
            existing.conventions.push({
              name: conv.toLowerCase().replace(/\s+/g, '_'),
              rules: [conv]
            });
          }
        }
      });

      // Merge conventions into existing agents
      if (existing.agents) {
        existing.agents.forEach(agent => {
          if (!agent.conventions) agent.conventions = [];
          definition.conventions.forEach(conv => {
            if (!agent.conventions.some(c => c.name === conv || c.rules?.includes(conv))) {
              if (typeof conv === 'string') {
                agent.conventions.push({
                  name: conv.toLowerCase().replace(/\s+/g, '_'),
                  rules: [conv]
                });
              }
            }
          });
        });
      }
      break;

    case 'workflow':
      if (!existing.workflows) existing.workflows = [];
      existing.workflows.push(definition);
      break;
  }

  // Create new AST and write
  const newAST = new CanonicalAST(existing);

  if (dryRun) {
    console.log(`\n[Dry Run] Merging ${type} "${definition.name || definition.type}":`);
    console.log('---');
    console.log(JSON.stringify(definition, null, 2));
    console.log('---\n');

    if (ide) {
      console.log(`[Dry Run] Would sync with IDE: ${ide}`);
    }
  } else {
    await writeYAMLFile(yamlPath, newAST);
    console.log(`Added ${type} "${definition.name || definition.type}" to rosetta.yaml`);

    // Perform sync if IDE specified
    if (ide) {
      await performSync(ide, yamlPath);
    }
  }
}

/**
 * Check for conflicts in existing definitions
 * @private
 */
function checkConflict(type, definition, existing) {
  switch (type) {
    case 'agent':
      if (existing.agents) {
        const existingAgent = existing.agents.find(a => a.name === definition.name);
        if (existingAgent) {
          return { type: 'agent', id: definition.name, existing: existingAgent };
        }
      }
      break;

    case 'persona':
      if (existing.conventions) {
        const personaConventions = definition.conventions;
        const hasConflict = personaConventions.some(conv =>
          existing.conventions.includes(conv)
        );
        if (hasConflict) {
          return { type: 'persona', id: definition.type, existing: existing.conventions };
        }
      }
      break;

    case 'workflow':
      if (existing.workflows) {
        const existingWorkflow = existing.workflows.find(w => w.name === definition.name);
        if (existingWorkflow) {
          return { type: 'workflow', id: definition.name, existing: existingWorkflow };
        }
      }
      break;
  }

  return null;
}

/**
 * Prompt user for conflict resolution
 * @private
 */
async function promptConflictResolution(type, definition, conflict) {
  const questions = [
    {
      type: 'list',
      name: 'resolution',
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} "${definition.name || definition.type}" already exists. What would you like to do?`,
      choices: [
        { name: 'Skip - Do not add this definition', value: 'skip' },
        { name: 'Replace - Remove existing and add new', value: 'replace' }
      ],
      default: 'skip'
    }
  ];

  // Add merge option for personas
  if (type === 'persona') {
    questions[0].choices.push(
      { name: 'Merge - Combine conventions', value: 'merge' }
    );
    questions[0].default = 'merge';
  }

  const answers = await inquirer.prompt(questions);
  return answers.resolution;
}

/**
 * Remove item from array by ID
 * @private
 */
function removeFromArray(obj, type, id) {
  switch (type) {
    case 'agent':
      if (obj.agents) {
        obj.agents = obj.agents.filter(a => a.name !== id);
      }
      break;
    case 'workflow':
      if (obj.workflows) {
        obj.workflows = obj.workflows.filter(w => w.name !== id);
      }
      break;
  }
}

/**
 * Merge persona conventions
 * @private
 */
function mergeConventions(existing, persona) {
  // Add unique conventions
  persona.conventions.forEach(conv => {
    if (!existing.conventions.includes(conv)) {
      existing.conventions.push(conv);
    }
  });
}

/**
 * Perform sync with IDE
 * @private
 */
async function performSync(ide, yamlPath) {
  try {
    const { performSync } = await import('../ide-adapters.js');
    await performSync(yamlPath, ide);
    console.log(`Synced with ${ide}`);
  } catch (error) {
    console.warn(`Sync with ${ide} failed: ${error.message}`);
  }
}