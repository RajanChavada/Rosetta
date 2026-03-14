import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { TreeLogger, dryRunWrite } from '../lib/utils.js';
import chalk from 'chalk';

// Mock console.log to avoid cluttering test output
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('TreeLogger', () => {
  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  test('should log root label correctly', () => {
    new TreeLogger('Test Root');
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('● Test Root'));
  });

  test('logStep should log message with default status', () => {
    const logger = new TreeLogger('Root');
    logger.logStep('Step 1');
    // Use regex to account for ANSI codes
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Step 1/));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/✓/));
  });

  test('logStep should log message with custom status and isLast flag', () => {
    const logger = new TreeLogger('Root');
    logger.logStep('Final Step', '!', true);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/Final Step/));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringMatching(/!/));
  });
});

describe('dryRunWrite', () => {
  beforeEach(() => {
    consoleLogSpy.mockClear();
  });

  test('should return true and log message in dry-run mode', async () => {
    const result = await dryRunWrite('test.txt', 'write', { dryRun: true });
    expect(result).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[Dry-run] Would write: test.txt'));
  });

  test('should return false in normal mode', async () => {
    const result = await dryRunWrite('test.txt', 'write', { dryRun: false });
    expect(result).toBe(false);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
