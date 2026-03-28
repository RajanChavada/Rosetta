/**
 * Cursor Generator
 *
 * Generates .cursorrules configuration from Canonical AST
 */

import { BaseGenerator } from './base-generator.js';

/**
 * Cursor specific generator
 */
export class CursorGenerator extends BaseGenerator {
  constructor(options = {}) {
    super('cursor', options);
  }

  /**
   * Generate .cursorrules content
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Generated .cursorrules content
   */
  generate(ast) {
    this.validateAST(ast);

    const sections = [];

    // Header
    sections.push(this.buildHeader(ast));

    // Persona section (Cursor specific)
    sections.push(this.buildPersonaSection(ast));

    // Project overview
    sections.push(this.buildProjectOverview(ast));

    // Reasoning modes (Cursor specific)
    sections.push(this.buildReasoningModes(ast));

    // SOPs
    sections.push(this.buildSOPs(ast));

    // Conventions
    sections.push(this.buildConventions(ast));

    // Commands
    sections.push(this.buildCommands(ast));

    // Notes
    sections.push(this.buildNotes(ast));

    // Agents
    sections.push(this.buildAgents(ast));

    let content = sections.join('\n');

    // Apply Cursor-specific overrides
    content = this.applyOverrides(ast, content);

    return content;
  }

  /**
   * Build Cursor specific persona section
   */
  buildPersonaSection(ast) {
    const project = ast.toObject().project;
    const lines = [];

    lines.push('## Persona: Senior AI Solutions Architect');
    lines.push('');
    lines.push(`You are a **Senior AI Solutions Architect** and **Agentic Workflow Expert**. You treat Cursor as your high-fidelity engineering workbench. Every edit you make should reinforce the architectural goals and professional standards of ${project.name}.`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build Cursor specific reasoning modes section
   */
  buildReasoningModes(ast) {
    const lines = [];

    lines.push('## Core Reasoning Modes');
    lines.push('');
    lines.push('Before making any file edits, internalize these perspectives:');
    lines.push('- **Divergent Ideation**: Generate multiple approaches (at least 3) for complex features.');
    lines.push('- **Inversion Thinking**: Ask, "What critical failure is this change likely to cause?"');
    lines.push('- **Convergence**: Select the most robust approach based on project patterns.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build Cursor specific SOPs section
   */
  buildSOPs(ast) {
    const lines = [];

    lines.push('## Standard Operating Procedures (SOPs)');
    lines.push('');
    lines.push('1. **Initialize State**: Check `.ai/task.md` before every action.');
    lines.push('2. **Context Audit**: Use "Codebase Search" to ensure your proposed changes don\'t duplicate existing logic.');
    lines.push('3. **Atomic Modification**: Keep diffs tight and logical. Avoid large, multi-file "mega-commits".');
    lines.push('4. **Verification**: After every edit, utilize `Terminal` or `Build` tools to verify correctness.');
    lines.push('');

    lines.push('## Execution Constraints');
    lines.push('');
    lines.push('- **Spec Compliance**: Never deviate from `rosetta.yaml` without explicit permission.');
    lines.push('- **Risk Awareness**: Prioritize security and data safety based on project risk level.');
    lines.push('- **Stack Consistency**: Adhere to technology stack conventions.');
    lines.push('- **Task Tracking**: Do not perform work that isn\'t captured in a task log entry.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get the target file path for Cursor
   */
  getTargetPath() {
    return '.cursorrules';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions() {
    return ['.md', '', '.txt'];
  }

  /**
   * Apply Cursor-specific overrides
   */
  applyOverrides(ast, content) {
    const overrides = ast.getIDEOverrides('cursor');

    if (!overrides || Object.keys(overrides).length === 0) {
      return content;
    }

    // Apply reasoning modes override
    if (overrides.reasoning_modes && overrides.reasoning_modes.length > 0) {
      const modesList = overrides.reasoning_modes.map(m => `- **${m}**`).join('\n');
      content = content.replace(
        /- \*\*Divergent Ideation\*\*: [^\n]+\n- \*\*Inversion Thinking\*\*: [^\n]+\n- \*\*Convergence\*\*: [^\n]+/,
        modesList
      );
    }

    return content;
  }
}

export default CursorGenerator;
