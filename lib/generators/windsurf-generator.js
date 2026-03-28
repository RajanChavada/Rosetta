/**
 * Windsurf Generator
 *
 * Generates .windsurfrules configuration from Canonical AST
 */

import { BaseGenerator } from './base-generator.js';

/**
 * Windsurf specific generator
 */
export class WindsurfGenerator extends BaseGenerator {
  constructor(options = {}) {
    super('windsurf', options);
  }

  /**
   * Generate .windsurfrules content
   * @param {CanonicalAST} ast - The canonical AST
   * @returns {string} Generated .windsurfrules content
   */
  generate(ast) {
    this.validateAST(ast);

    const sections = [];

    // Header
    sections.push(this.buildHeader(ast));

    // Persona section (Windsurf specific)
    sections.push(this.buildPersonaSection(ast));

    // Project overview
    sections.push(this.buildProjectOverview(ast));

    // Collaboration section (Windsurf specific)
    sections.push(this.buildCollaborationSection(ast));

    // Conventions
    sections.push(this.buildConventions(ast));

    // Commands
    sections.push(this.buildCommands(ast));

    // Notes
    sections.push(this.buildNotes(ast));

    // Agents
    sections.push(this.buildAgents(ast));

    let content = sections.join('\n');

    // Apply Windsurf-specific overrides
    content = this.applyOverrides(ast, content);

    return content;
  }

  /**
   * Build Windsurf specific persona section
   */
  buildPersonaSection(ast) {
    const project = ast.toObject().project;
    const lines = [];

    lines.push('## Core Persona');
    lines.push('');
    lines.push(`You are a **Senior AI Solutions Architect** working on ${project.name}. You collaborate with the development team through Windsurf\'s AI-native interface.`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build Windsurf specific collaboration section
   */
  buildCollaborationSection(ast) {
    const lines = [];

    lines.push('## Collaboration Guidelines');
    lines.push('');
    lines.push('Windsurf enables seamless AI-human collaboration. Follow these principles:');
    lines.push('');
    lines.push('1. **Transparency**: Always explain your reasoning before making changes.');
    lines.push('2. **Verification**: Use Cascade to verify your changes don\'t break existing functionality.');
    lines.push('3. **Context Awareness**: Leverage the codebase awareness features to make informed decisions.');
    lines.push('4. **Iterative Refinement**: Be prepared to refine your approach based on feedback.');
    lines.push('');

    lines.push('## Workflow');
    lines.push('');
    lines.push('1. **Analyze**: Use the codebase awareness to understand context.');
    lines.push('2. **Propose**: Suggest changes with clear explanations.');
    lines.push('3. **Implement**: Make atomic, verifiable changes.');
    lines.push('4. **Verify**: Run tests and use Cascade to ensure integrity.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Build Windsurf specific constraints section
   */
  buildSOPs(ast) {
    const lines = [];

    lines.push('## Constraints');
    lines.push('');
    lines.push('- **Spec Compliance**: All changes must align with `rosetta.yaml`.');
    lines.push('- **Risk Awareness**: Consider the security and performance implications of all changes.');
    lines.push('- **Stack Consistency**: Follow established patterns and conventions.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get the target file path for Windsurf
   */
  getTargetPath() {
    return '.windsurfrules';
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions() {
    return ['.md', '', '.txt'];
  }

  /**
   * Apply Windsurf-specific overrides
   */
  applyOverrides(ast, content) {
    const overrides = ast.getIDEOverrides('windsurf');

    if (!overrides || Object.keys(overrides).length === 0) {
      return content;
    }

    // Apply collaboration mode override
    if (overrides.collaboration_mode) {
      content = content.replace(
        /Windsurf enables seamless AI-human collaboration/,
        `Windsurf operates in **${overrides.collaboration_mode}** collaboration mode`
      );
    }

    return content;
  }
}

export default WindsurfGenerator;
