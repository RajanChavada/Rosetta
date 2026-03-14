import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { IDETranslator } from '../../lib/translators/base.js';
import { translate } from '../../lib/commands/translate.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  red: jest.fn(str => str),
  gray: jest.fn(str => str)
}));

const mockFs = fs;

describe('Integration: translate command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('basic translation', () => {
    test('should translate cursor format to claude format', async () => {
      const cursorContent = `## Rules
You are a helpful assistant.
## Constraints
Keep responses concise.`;

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(cursorContent);
      mockFs.writeFile.mockResolvedValue();

      await translate('test.cursorrules', {
        from: 'cursor',
        to: 'claude',
        output: 'test-claude.md'
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-claude.md',
        expect.stringContaining('Claude Code Rules')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'test-claude.md',
        expect.stringContaining('## Rules')
      );
    });

    test('should translate claude format to cursor format', async () => {
      const claudeContent = `## Guidelines
Write clean code.
## Style
Use ES6+.`;

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(claudeContent);
      mockFs.writeFile.mockResolvedValue();

      await translate('CLAUDE.md', {
        from: 'claude',
        to: 'cursor',
        output: '.cursorrules'
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.cursorrules',
        expect.stringContaining('Cursor Rules')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.cursorrules',
        expect.stringContaining('## Guidelines')
      );
    });

    test('should translate to copilot format', async () => {
      const sourceContent = '## Project Rules\nWrite tests first.';
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(sourceContent);
      mockFs.writeFile.mockResolvedValue();

      await translate('source.md', {
        from: 'claude',
        to: 'copilot',
        output: 'copilot-instructions.md'
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'copilot-instructions.md',
        expect.stringContaining('AI Assistant Instructions')
      );
    });
  });

  describe('auto-detection', () => {
    test('should detect format from file path when --from not specified', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nBe helpful.');
      mockFs.writeFile.mockResolvedValue();

      await translate('.cursorrules', {
        to: 'claude'
      });

      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    test('should handle auto-detection for known file patterns', async () => {
      const testCases = [
        { file: '.cursorrules', expectedFormat: 'cursor' },
        { file: 'CLAUDE.md', expectedFormat: 'claude' },
        { file: 'copilot-instructions.md', expectedFormat: 'copilot' }
      ];

      for (const testCase of testCases) {
        mockFs.pathExists.mockResolvedValue(true);
        mockFs.readFile.mockResolvedValue('## Test\nContent.');
        mockFs.writeFile.mockResolvedValue();

        await translate(testCase.file, {
          to: 'claude',
          output: `output-${testCase.file}`
        });

        expect(mockFs.writeFile).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });
  });

  describe('output handling', () => {
    test('should generate default output path when --output not specified', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nContent.');
      mockFs.writeFile.mockResolvedValue();

      await translate('source.md', {
        from: 'claude',
        to: 'cursor'
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'source-cursor.md',
        expect.any(String)
      );
    });

    test('should use specified output path when --output provided', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nContent.');
      mockFs.writeFile.mockResolvedValue();

      await translate('source.md', {
        from: 'claude',
        to: 'cursor',
        output: 'custom-output.md'
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'custom-output.md',
        expect.any(String)
      );
    });
  });

  describe('dry-run mode', () => {
    test('should not write files in dry-run mode', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nContent.');

      await translate('source.md', {
        from: 'claude',
        to: 'cursor',
        output: 'output.md',
        dryRun: true
      });

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Dry-run]'));
    });

    test('should show output preview in dry-run mode', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nBe helpful.');

      await translate('source.md', {
        from: 'claude',
        to: 'cursor',
        dryRun: true
      });

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Output preview'));
    });
  });

  describe('error handling', () => {
    test('should return early when input file does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      await translate('nonexistent.md', {
        from: 'claude',
        to: 'cursor'
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Input file not found')
      );
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });

    test('should handle unknown target format', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Content');

      await translate('source.md', {
        from: 'claude',
        to: 'unknown-format'
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Unknown target format')
      );
    });

    test('should handle translation errors gracefully', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('## Rules\nContent.');
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));

      await translate('source.md', {
        from: 'claude',
        to: 'cursor'
      });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Translation failed')
      );
    });
  });

  describe('format mapping', () => {
    test('should normalize common format aliases', () => {
      const aliases = [
        { from: 'cursorrules', to: 'cursor' },
        { from: 'claude-code', to: 'claude' },
        { from: 'anthropic', to: 'claude' },
        { from: 'github-copilot', to: 'copilot' },
        { from: 'continue-dev', to: 'continue' }
      ];

      for (const alias of aliases) {
        mockFs.pathExists.mockResolvedValue(true);
        mockFs.readFile.mockResolvedValue('Content');
        mockFs.writeFile.mockResolvedValue();

        await translate('source.md', {
          from: alias.from,
          to: 'claude',
          output: 'output.md'
        });

        expect(mockFs.writeFile).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });
  });

  describe('translator API', () => {
    test('should use IDETranslator to perform translation', async () => {
      const input = '## Rules\nTest content.';
      const fromFormat = 'claude';
      const toFormat = 'cursor';

      const result = await IDETranslator.translate(input, fromFormat, toFormat);

      expect(result).toContain('Cursor Rules');
      expect(result).toContain('## Rules');
    });

    test('should throw error for unsupported format', async () => {
      const input = 'Content';
      const fromFormat = 'unsupported';

      await expect(
        IDETranslator.translate(input, fromFormat, 'claude')
      ).rejects.toThrow('No parser found for format');
    });
  });
});
