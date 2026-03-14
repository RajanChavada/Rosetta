import chalk from 'chalk';

/**
 * Base translator class for converting between IDE configuration formats.
 */
export class IDETranslator {
  /**
   * Translate a configuration file from one IDE format to another.
   * @param {string} input - The input file content
   * @param {string} fromFormat - Source format (e.g., 'cursor', 'claude', 'copilot')
   * @param {string} toFormat - Target format (e.g., 'claude', 'cursor', 'copilot')
   * @returns {string} Translated content in target format
   */
  static async translate(input, fromFormat, toFormat) {
    const ir = this.parse(input, fromFormat);
    const transformed = this.transform(ir, fromFormat, toFormat);
    return this.generate(transformed, toFormat);
  }

  /**
   * Parse input into intermediate representation.
   * @param {string} input - Raw input content
   * @param {string} format - Source format
   * @returns {object} Intermediate representation
   */
  static parse(input, format) {
    const parser = this.getParser(format);
    return parser(input);
  }

  /**
   * Transform intermediate representation from source to target format.
   * @param {object} ir - Intermediate representation
   * @param {string} fromFormat - Source format
   * @param {string} toFormat - Target format
   * @returns {object} Transformed intermediate representation
   */
  static transform(ir, fromFormat, toFormat) {
    // By default, return IR unchanged
    // Specific translators can override this
    return ir;
  }

  /**
   * Generate output from intermediate representation.
   * @param {object} ir - Intermediate representation
   * @param {string} format - Target format
   * @returns {string} Generated content
   */
  static generate(ir, format) {
    const generator = this.getGenerator(format);
    return generator(ir);
  }

  /**
   * Get parser for a specific format.
   */
  static getParser(format) {
    const parsers = {
      cursor: this.parseCursor,
      claude: this.parseClaude,
      copilot: this.parseCopilot,
      windsurf: this.parseGeneric,
      antigravity: this.parseGeneric,
      gsd: this.parseGeneric,
      codex: this.parseGeneric,
      kilo: this.parseGeneric,
      continue: this.parseGeneric
    };

    const parser = parsers[format.toLowerCase()];
    if (!parser) {
      throw new Error(`No parser found for format: ${format}`);
    }
    return parser;
  }

  /**
   * Get generator for a specific format.
   */
  static getGenerator(format) {
    const generators = {
      cursor: this.generateCursor,
      claude: this.generateClaude,
      copilot: this.generateCopilot,
      windsurf: this.generateGeneric,
      antigravity: this.generateGeneric,
      gsd: this.generateGeneric,
      codex: this.generateGeneric,
      kilo: this.generateGeneric,
      continue: this.generateGeneric
    };

    const generator = generators[format.toLowerCase()];
    if (!generator) {
      throw new Error(`No generator found for format: ${format}`);
    }
    return generator;
  }

  /**
   * Parse Cursor rules format.
   */
  static parseCursor(input) {
    const lines = input.split('\n');
    const sections = {};
    let currentSection = null;
    let content = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = content.join('\n');
        }
        currentSection = line.replace('## ', '').trim();
        content = [];
      } else {
        content.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = content.join('\n');
    }

    return {
      format: 'cursor',
      sections,
      raw: input
    };
  }

  /**
   * Parse Claude Code format.
   */
  static parseClaude(input) {
    const lines = input.split('\n');
    const sections = {};
    let currentSection = null;
    let content = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) {
          sections[currentSection] = content.join('\n');
        }
        currentSection = line.replace('## ', '').trim();
        content = [];
      } else {
        content.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = content.join('\n');
    }

    return {
      format: 'claude',
      sections,
      raw: input
    };
  }

  /**
   * Parse generic format (copilot, windsurf, etc.).
   */
  static parseGeneric(input) {
    return {
      format: 'generic',
      sections: {
        'Rules': input
      },
      raw: input
    };
  }

  /**
   * Parse Copilot format.
   */
  static parseCopilot(input) {
    return this.parseGeneric(input);
  }

  /**
   * Generate Cursor format.
   */
  static generateCursor(ir) {
    const { sections } = ir;
    let output = `# Cursor Rules for {{PROJECT_NAME}}\n\n`;
    output += `> Managed by Rosetta. Primary spec: .ai/master-skill.md.\n\n`;

    for (const [key, value] of Object.entries(sections)) {
      output += `## ${key}\n\n${value}\n\n`;
    }

    return output.trim();
  }

  /**
   * Generate Claude format.
   */
  static generateClaude(ir) {
    const { sections } = ir;
    let output = `# Claude Code Rules: {{PROJECT_NAME}} (Anthropic Style)\n\n`;
    output += `> Managed by Rosetta. Primary spec: .ai/master-skill.md.\n\n`;

    for (const [key, value] of Object.entries(sections)) {
      output += `## ${key}\n\n${value}\n\n`;
    }

    return output.trim();
  }

  /**
   * Generate Copilot format.
   */
  static generateCopilot(ir) {
    const { sections } = ir;
    let output = `# {{PROJECT_NAME}} - AI Assistant Instructions\n\n`;
    output += `> Managed by Rosetta. Primary spec: .ai/master-skill.md.\n\n`;

    for (const [key, value] of Object.entries(sections)) {
      output += `## ${key}\n\n${value}\n\n`;
    }

    return output.trim();
  }

  /**
   * Generate generic format.
   */
  static generateGeneric(ir, formatName = 'Generic') {
    const { sections } = ir;
    let output = `# ${formatName} Rules: {{PROJECT_NAME}}\n\n`;
    output += `> Managed by Rosetta. Primary spec: .ai/master-skill.md.\n\n`;

    for (const [key, value] of Object.entries(sections)) {
      output += `## ${key}\n\n${value}\n\n`;
    }

    return output.trim();
  }
}
