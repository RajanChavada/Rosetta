/**
 * Base Generator Class
 *
 * Abstract base class for all IDE generators
 * Generates IDE-specific configuration from Canonical AST
 */

import { formatMetadata } from '../ast/metadata.js';

/**
 * Base Generator class
 * All IDE generators should extend this class
 */
export class BaseGenerator {
  /**
   * @param {string} ide - IDE identifier
   * @param {Object} options - Generator options
   */
  constructor(ide, options = {}) {
    this.ide = ide;
    this.options = {
      includeMetadata: true,
      includeCommands: true,
      includeConventions: true,
      includeNotes: true,
      includeAgents: true,
      includeWorkflows: true,
      ...options
    };
  }

  /**
   * Generate IDE configuration from Canonical AST
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Generated configuration content
   */
  generate(ast) {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Get the target file path for this IDE
   * @returns {string} Target file path
   */
  getTargetPath() {
    throw new Error('getTargetPath() must be implemented by subclass');
  }

  /**
   * Get supported file extensions for this IDE
   * @returns {Array<string>} Supported extensions
   */
  getSupportedExtensions() {
    return ['.md', '.txt'];
  }

  /**
   * Build common header section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Header section
   */
  buildHeader(ast) {
    const lines = [];

    lines.push(`# ${this.getDisplayName()} Rules for ${ast.getProjectName()}`);
    lines.push('');

    if (this.options.includeMetadata) {
      lines.push('<!--');
      lines.push('  Managed by Rosetta from rosetta.yaml');
      lines.push(`  Generated: ${new Date().toISOString()}`);
      lines.push('-->');
      lines.push('');
    }

    lines.push(`> Primary configuration: rosetta.yaml`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build project overview section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Project overview section
   */
  buildProjectOverview(ast) {
    const lines = [];
    const project = ast.toObject().project;
    const stack = ast.toObject().stack;

    lines.push('## Project Overview');
    lines.push('');
    lines.push(`**Name:** ${project.name}`);
    lines.push(`**Type:** ${project.type}`);
    lines.push(`**Description:** ${project.description}`);
    lines.push('');
    lines.push('### Technology Stack');
    lines.push('');
    lines.push(`- **Language:** ${stack.language}`);

    if (stack.frontend && stack.frontend.length > 0) {
      lines.push(`- **Frontend:** ${stack.frontend.join(', ')}`);
    }

    if (stack.backend && stack.backend.length > 0) {
      lines.push(`- **Backend:** ${stack.backend.join(', ')}`);
    }

    if (stack.datastores && stack.datastores.length > 0) {
      lines.push(`- **Datastores:** ${stack.datastores.join(', ')}`);
    }

    if (stack.testing && stack.testing.length > 0) {
      lines.push(`- **Testing:** ${stack.testing.join(', ')}`);
    }

    lines.push('');
    lines.push(`**Risk Level:** ${project.risk_level}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build conventions section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Conventions section
   */
  buildConventions(ast) {
    if (!this.options.includeConventions) {
      return '';
    }

    const conventions = ast.getConventions();

    if (conventions.length === 0) {
      return '';
    }

    const lines = [];
    lines.push('## Conventions');
    lines.push('');

    for (const conv of conventions) {
      lines.push(`### ${conv.name}`);
      lines.push('');

      if (conv.rules && conv.rules.length > 0) {
        for (const rule of conv.rules) {
          const enforced = rule.enforced ? '**[Enforced]**' : '[Optional]';
          lines.push(`- ${enforced} ${rule.description}`);

          if (rule.pattern) {
            lines.push(`  - Pattern: \`${rule.pattern}\``);
          }
        }
        lines.push('');
      }

      if (conv.examples && conv.examples.length > 0) {
        lines.push('**Examples:**');
        lines.push('');
        for (const example of conv.examples) {
          lines.push(`\`\`\``);
          lines.push(example);
          lines.push(`\`\`\``);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Build commands section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Commands section
   */
  buildCommands(ast) {
    if (!this.options.includeCommands) {
      return '';
    }

    const commands = ast.toObject().commands;
    const hasCommands = commands &&
      ((commands.dev && commands.dev.length > 0) ||
       (commands.test && commands.test.length > 0) ||
       (commands.build && commands.build.length > 0));

    if (!hasCommands) {
      return '';
    }

    const lines = [];
    lines.push('## Commands');
    lines.push('');

    if (commands.dev && commands.dev.length > 0) {
      lines.push('### Development');
      lines.push('');
      for (const cmd of commands.dev) {
        lines.push(`- **${cmd.name}**${cmd.description ? `: ${cmd.description}` : ''}`);
        lines.push(`  \`\`\`bash`);
        lines.push(`  ${cmd.command}`);
        lines.push(`  \`\`\``);
      }
      lines.push('');
    }

    if (commands.test && commands.test.length > 0) {
      lines.push('### Testing');
      lines.push('');
      for (const cmd of commands.test) {
        lines.push(`- **${cmd.name}**${cmd.description ? `: ${cmd.description}` : ''}`);
        lines.push(`  \`\`\`bash`);
        lines.push(`  ${cmd.command}`);
        lines.push(`  \`\`\``);
      }
      lines.push('');
    }

    if (commands.build && commands.build.length > 0) {
      lines.push('### Build');
      lines.push('');
      for (const cmd of commands.build) {
        lines.push(`- **${cmd.name}**${cmd.description ? `: ${cmd.description}` : ''}`);
        lines.push(`  \`\`\`bash`);
        lines.push(`  ${cmd.command}`);
        lines.push(`  \`\`\``);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Build notes section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Notes section
   */
  buildNotes(ast) {
    if (!this.options.includeNotes) {
      return '';
    }

    const notes = ast.getNotes();

    if (notes.length === 0) {
      return '';
    }

    // Group notes by category
    const grouped = {};
    for (const note of notes) {
      if (!grouped[note.category]) {
        grouped[note.category] = [];
      }
      grouped[note.category].push(note);
    }

    const lines = [];
    lines.push('## Notes');
    lines.push('');

    for (const [category, categoryNotes] of Object.entries(grouped)) {
      lines.push(`### ${category.replace('_', ' ').toUpperCase()}`);
      lines.push('');

      // Sort by priority (descending)
      categoryNotes.sort((a, b) => (b.priority || 5) - (a.priority || 5));

      for (const note of categoryNotes) {
        const priority = note.priority ? ` [Priority: ${note.priority}]` : '';
        lines.push(`#### ${note.title}${priority}`);
        lines.push('');
        lines.push(note.content);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Build agents section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Agents section
   */
  buildAgents(ast) {
    if (!this.options.includeAgents) {
      return '';
    }

    const agents = ast.getAgents();

    if (agents.length === 0) {
      return '';
    }

    const lines = [];
    lines.push('## Agents');
    lines.push('');

    for (const agent of agents) {
      lines.push(`### ${agent.name}`);
      lines.push('');
      lines.push(`**Role:** ${agent.role}`);
      lines.push(`**Style:** ${agent.style}`);
      lines.push(`**Scope:** ${agent.scope}`);

      if (agent.system_prompt) {
        lines.push('');
        lines.push('**System Prompt:**');
        lines.push('');
        lines.push(agent.system_prompt);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Apply IDE-specific overrides
   * @param {CanonicalAST} ast - The canonical AST
   * @param {string} content - Generated content
   * @returns {string} Content with overrides applied
   */
  applyOverrides(ast, content) {
    const overrides = ast.getIDEOverrides(this.ide);

    if (!overrides || Object.keys(overrides).length === 0) {
      return content;
    }

    // Subclasses can override this to apply IDE-specific customizations
    return content;
  }

  /**
   * Get display name for IDE
   * @returns {string} Display name
   */
  getDisplayName() {
    const names = {
      'claude': 'Claude Code',
      'cursor': 'Cursor',
      'windsurf': 'Windsurf',
      'copilot': 'GitHub Copilot',
      'codex': 'Codex CLI',
      'kilo': 'Kilo Code',
      'continue': 'Continue.dev'
    };
    return names[this.ide] || this.ide;
  }

  /**
   * Build workflows section
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Workflows section
   */
  buildWorkflows(ast) {
    if (!this.options.includeWorkflows) {
      return '';
    }

    const workflows = ast.getWorkflows();

    if (workflows.length === 0) {
      return '';
    }

    const lines = [];
    lines.push('## Workflows');
    lines.push('');

    for (const workflow of workflows) {
      lines.push(`### ${workflow.name}`);
      lines.push('');
      lines.push(`**Description:** ${workflow.description || 'No description provided'}`);
      lines.push('');

      if (workflow.steps && workflow.steps.length > 0) {
        lines.push('**Steps:**');
        lines.push('');

        for (const step of workflow.steps) {
          const statusIcon = step.condition ? '⚠️' : '✓';
          lines.push(`${statusIcon} **${step.id}** - ${step.description}`);

          if (step.depends_on && step.depends_on.length > 0) {
            lines.push(`  *Depends on: ${step.depends_on.join(', ')}*`);
          }

          if (step.parallel) {
            lines.push(`  *Can run in parallel*`);
          }

          if (step.condition) {
            lines.push(`  *Condition: ${step.condition}*`);
          }

          lines.push('');
        }
      }

      if (workflow.variables && Object.keys(workflow.variables).length > 0) {
        lines.push('**Variables:**');
        lines.push('');
        for (const [key, value] of Object.entries(workflow.variables)) {
          lines.push(`- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Validate the AST before generation
   * @param {CanonicalAST} ast - The canonical AST
   * @throws {Error} If AST is invalid
   */
  validateAST(ast) {
    if (!ast || typeof ast.toObject !== 'function') {
      throw new Error('Invalid AST: must be a CanonicalAST instance');
    }

    const validation = ast.validate();
    if (!validation.valid) {
      const errors = validation.errors.map(e => `  - ${e.path}: ${e.message}`).join('\n');
      throw new Error(`AST validation failed:\n${errors}`);
    }
  }
}

export default BaseGenerator;
