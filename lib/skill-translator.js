import path from 'path';
import { SKILL_WRAPPERS } from './constants.js';

/**
 * SkillTranslator
 *
 * Takes raw SKILL.md content and translates it into the native format
 * for any target IDE. Handles frontmatter replacement, path resolution,
 * and file layout differences (flat file vs directory).
 */
export class SkillTranslator {
  /**
   * Parse and strip existing YAML frontmatter from raw content.
   * Normalizes \r\n → \n before parsing to handle Windows contributors.
   *
   * @param {string} rawContent - Raw SKILL.md content
   * @returns {{ metadata: object, body: string }}
   */
  static parseFrontmatter(rawContent) {
    // Normalize Windows line endings
    const normalized = rawContent.replace(/\r\n/g, '\n');

    const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { metadata: {}, body: normalized };

    const metadata = {};
    for (const line of match[1].split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key && value) metadata[key] = value;
    }

    return { metadata, body: match[2] };
  }

  /**
   * Translate a skill to a single target IDE.
   *
   * @param {string} rawContent - Raw SKILL.md content
   * @param {object} metadata - Parsed frontmatter { name, description, ... }
   * @param {string} targetIde - Target IDE id (e.g., 'claude', 'cursor')
   * @returns {{ path: string, content: string, invocation: string }}
   */
  static translate(rawContent, metadata, targetIde) {
    const wrapper = SKILL_WRAPPERS[targetIde];
    if (!wrapper) {
      throw new Error(`No skill wrapper defined for IDE: ${targetIde}. ` +
        `Supported: ${Object.keys(SKILL_WRAPPERS).join(', ')}`);
    }

    const { body } = this.parseFrontmatter(rawContent);
    const name = metadata.name;
    const description = metadata.description || '';

    // Generate IDE-native frontmatter
    const nativeFrontmatter = wrapper.frontmatter(name, description);

    // Build file content: native frontmatter + original body
    const content = nativeFrontmatter + '\n' + body.trim() + '\n';

    // Build file path based on layout
    let filePath;
    if (wrapper.fileLayout === 'directory') {
      filePath = path.join(wrapper.basePath, name, wrapper.fileName);
    } else {
      filePath = path.join(wrapper.basePath, `${name}${wrapper.fileExtension}`);
    }

    // Build invocation hint for display
    const invocation = wrapper.invocationPrefix
      ? `${wrapper.invocationPrefix}${name}`
      : name;

    return { path: filePath, content, invocation };
  }

  /**
   * Translate a skill to ALL specified IDEs.
   *
   * @param {string} rawContent - Raw SKILL.md content
   * @param {object} metadata - Parsed frontmatter { name, description, ... }
   * @param {string[]} targetIdes - Array of IDE ids (e.g., ['claude', 'cursor'])
   * @returns {Array<{ ide: string, path: string, content: string, invocation: string }>}
   */
  static translateAll(rawContent, metadata, targetIdes) {
    return targetIdes
      .filter(ide => SKILL_WRAPPERS[ide]) // Skip IDEs without wrappers
      .map(ide => ({
        ide,
        ...this.translate(rawContent, metadata, ide)
      }));
  }

  /**
   * Get the list of supported IDE ids for translation.
   * @returns {string[]}
   */
  static getSupportedIdes() {
    return Object.keys(SKILL_WRAPPERS);
  }

  /**
   * Map a detected IDE name (from detectIdes) to its SKILL_WRAPPERS key.
   * E.g., 'Claude Code' → 'claude', 'Cursor' → 'cursor'
   *
   * @param {string} ideName - IDE display name from detectIdes()
   * @returns {string|null} SKILL_WRAPPERS key or null
   */
  static ideNameToKey(ideName) {
    const map = {
      'Claude Code': 'claude',
      'Cursor': 'cursor',
      'Windsurf': 'windsurf',
      'Codex CLI': 'codex',
      'Antigravity': 'antigravity',
      'GitHub Copilot': 'copilot',
      'Kilo Code': 'kilo',
      'Continue.dev': 'continue',
      'Generic': null // No wrapper for generic
    };
    return map[ideName] ?? null;
  }
}

export default SkillTranslator;
