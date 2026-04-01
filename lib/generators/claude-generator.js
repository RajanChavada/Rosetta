/**
 * Claude Code Generator
 *
 * Generates CLAUDE.md configuration from Canonical AST
 */

import { BaseGenerator } from './base-generator.js';

/**
 * Claude Code specific generator
 */
export class ClaudeGenerator extends BaseGenerator {
  constructor(options = {}) {
    super('claude', options);
  }

  /**
   * Generate CLAUDE.md content
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Generated CLAUDE.md content
   */
  generate(ast) {
    this.validateAST(ast);

    const sections = [];

    // Header
    sections.push(this.buildHeader(ast));

    // Persona section (Claude Code specific)
    sections.push(this.buildPersonaSection(ast));

    // Project overview
    sections.push(this.buildProjectOverview(ast));

    // Workflow section (Claude Code specific)
    sections.push(this.buildWorkflowsSection(ast));

    // Conventions
    sections.push(this.buildConventions(ast));

    // Commands
    sections.push(this.buildCommands(ast));

    // Notes
    sections.push(this.buildNotes(ast));

    // Agents
    sections.push(this.buildAgents(ast));

    // IDE-specific overrides
    let content = sections.join('\n');

    // Apply Claude-specific overrides
    const overrides = ast.getIDEOverrides('claude');
    if (overrides.persona) {
      content = content.replace(
        /## Core Persona\n\n[^\n]+\n\nYou are [^\n]+\./,
        `## Core Persona\n\nYou are a **${overrides.persona}**.`
      );
    }

    if (overrides.additional_context) {
      content += `\n\n## Additional Context\n\n${overrides.additional_context}\n`;
    }

    return content;
  }

  /**
   * Build Claude Code specific persona section
   */
  buildPersonaSection(ast) {
    const project = ast.toObject().project;
    const lines = [];

    lines.push('## Core Persona: Senior AI Solutions Architect');
    lines.push('');
    lines.push(`You are a **Senior AI Solutions Architect** and **Agentic Workflow Expert**. You are the primary autonomous agent for ${project.name}. Your goal is to work with the user to build high-quality software, treating every interaction as a high-stakes design workshop.`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build Claude Code specific workflow section
   */
  buildWorkflowsSection(ast) {
    return this.buildWorkflows(ast);
  }

  /**
   * Get the target file path for Claude Code
   */
  getTargetPath() {
    return 'CLAUDE.md';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions() {
    return ['.md'];
  }

  /**
   * Apply Claude-specific overrides
   */
  applyOverrides(ast, content) {
    const overrides = ast.getIDEOverrides('claude');

    if (!overrides || Object.keys(overrides).length === 0) {
      return content;
    }

    // Apply persona override
    if (overrides.persona) {
      content = content.replace(
        /You are a \*\*[^*]+\*\*/,
        `You are a **${overrides.persona}**`
      );
    }

    // Append additional context
    if (overrides.additional_context) {
      content += `\n\n## Additional Context\n\n${overrides.additional_context}\n`;
    }

    return content;
  }
}

export default ClaudeGenerator;
