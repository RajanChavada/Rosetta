import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock fs-extra before importing the module
const readFileMock = jest.fn();
const pathExistsMock = jest.fn();

jest.unstable_mockModule('fs-extra', () => ({
  default: {
    readFile: readFileMock,
    pathExists: pathExistsMock,
  }
}));

// Mock chalk
const chalkRedMock = jest.fn((msg) => `Error: ${msg}`);
jest.unstable_mockModule('chalk', () => ({
  default: { red: chalkRedMock },
  red: chalkRedMock,
}));

// Mock child_process
let execSyncMock;
jest.unstable_mockModule('child_process', () => ({
  execSync: execSyncMock = jest.fn(),
}));

// Import the module after mocks are set up
let utils;
beforeAll(async () => {
  utils = await import('../../lib/visualizers/utils.js');
});

beforeEach(() => {
  jest.clearAllMocks();
  execSyncMock.mockClear();
});

describe('escapeHtml', () => {
  test('should escape ampersand', () => {
    expect(utils.escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  test('should escape less than sign', () => {
    expect(utils.escapeHtml('foo < bar')).toBe('foo &lt; bar');
  });

  test('should escape greater than sign', () => {
    expect(utils.escapeHtml('foo > bar')).toBe('foo &gt; bar');
  });

  test('should escape double quotes', () => {
    expect(utils.escapeHtml('foo "bar"')).toBe('foo &quot;bar&quot;');
  });

  test('should escape single quotes', () => {
    expect(utils.escapeHtml("foo 'bar'")).toBe('foo &#039;bar&#039;');
  });

  test('should escape all HTML special characters combined', () => {
    expect(utils.escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    );
  });

  test('should handle null and undefined', () => {
    expect(utils.escapeHtml(null)).toBe('null');
    expect(utils.escapeHtml(undefined)).toBe('undefined');
  });

  test('should handle numbers', () => {
    expect(utils.escapeHtml(123)).toBe('123');
  });

  test('should handle empty string', () => {
    expect(utils.escapeHtml('')).toBe('');
  });
});

describe('escapeJsonForScript', () => {
  test('should escape less than sign to prevent </script> break', () => {
    const data = { text: '</script>' };
    const json = JSON.stringify(data);
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).not.toContain('</script>');
    expect(escaped).toContain('\\u003c/script>');
  });

  test('should escape line separator (\\u2028)', () => {
    const data = { text: 'line1\u2028line2' };
    const json = JSON.stringify(data);
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).toContain('\\u2028');
  });

  test('should escape paragraph separator (\\u2029)', () => {
    const data = { text: 'para1\u2029para2' };
    const json = JSON.stringify(data);
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).toContain('\\u2029');
  });

  test('should preserve regular JSON without special characters', () => {
    const data = { name: 'test', value: 123 };
    const json = JSON.stringify(data);
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).toBe(json);
  });

  test('should escape all dangerous sequences in complex object', () => {
    const data = {
      html: '<div>test</div>',
      script: '</script>',
      lines: 'line1\u2028line2\u2029line3'
    };
    const json = JSON.stringify(data);
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).not.toContain('</script>');
    expect(escaped).toContain('\\u003c');
    expect(escaped).toContain('\\u2028');
    expect(escaped).toContain('\\u2029');
  });

  test('should handle empty object', () => {
    const json = JSON.stringify({});
    const escaped = utils.escapeJsonForScript(json);
    expect(escaped).toBe('{}');
  });
});

describe('readTemplate', () => {
  test('should read template file and return string', async () => {
    const mockContent = '<html>{{PLACEHOLDER}}</html>';
    readFileMock.mockResolvedValue(mockContent);

    const result = await utils.readTemplate('/path/to/template.html');

    expect(readFileMock).toHaveBeenCalledWith('/path/to/template.html', 'utf8');
    expect(result).toBe(mockContent);
  });

  test('should throw error when file not found', async () => {
    const error = new Error('File not found');
    readFileMock.mockRejectedValue(error);

    await expect(utils.readTemplate('/missing/file.html')).rejects.toThrow();
  });

  test('should propagate read errors correctly', async () => {
    readFileMock.mockRejectedValue(new Error('ENOENT: no such file'));

    await expect(utils.readTemplate('/missing/file.html')).rejects.toThrow();
  });
});

describe('openBrowser', () => {
  let originalPlatformDescriptor;

  beforeAll(() => {
    // Save the original descriptor so we can restore it
    originalPlatformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    // Restore original platform descriptor
    if (originalPlatformDescriptor) {
      Object.defineProperty(process, 'platform', originalPlatformDescriptor);
    }
  });

  const setPlatform = (platform) => {
    Object.defineProperty(process, 'platform', {
      value: platform,
      writable: true,
      configurable: true,
    });
  };

  test('should use "open" on darwin platform', () => {
    setPlatform('darwin');
    execSyncMock.mockImplementation(() => {});

    utils.openBrowser('/path/to/file.html');

    expect(execSyncMock).toHaveBeenCalledWith(
      'open "file:///path/to/file.html"',
      { stdio: 'ignore' }
    );
  });

  test('should use "start" on win32 platform', () => {
    setPlatform('win32');
    execSyncMock.mockImplementation(() => {});

    utils.openBrowser('C:\\path\\to\\file.html');

    // Check that it calls start with the appropriate URL pattern
    expect(execSyncMock).toHaveBeenCalledWith(
      expect.stringMatching(/^start "file:\/\/.*\\path\\to\\file\.html"$/),
      { stdio: 'ignore' }
    );
  });

  test('should use "xdg-open" on Linux platform', () => {
    setPlatform('linux');
    execSyncMock.mockImplementation(() => {});

    utils.openBrowser('/path/to/file.html');

    expect(execSyncMock).toHaveBeenCalledWith(
      'xdg-open "file:///path/to/file.html"',
      { stdio: 'ignore' }
    );
  });

  test('should resolve relative path to absolute path', () => {
    setPlatform('darwin');
    execSyncMock.mockImplementation(() => {});

    const relativePath = './docs/skills.html';
    utils.openBrowser(relativePath);

    // We can't easily test path.resolve output without mocking, so just check execSync call
    expect(execSyncMock).toHaveBeenCalled();
    const callArg = execSyncMock.mock.calls[0][0];
    expect(callArg).toMatch(/^open "file:\/\/.*docs\/skills\.html"$/);
  });

  test('should throw error when execSync fails', () => {
    setPlatform('darwin');
    execSyncMock.mockImplementation(() => {
      throw new Error('Command failed');
    });

    expect(() => utils.openBrowser('/path/to/file.html')).toThrow(Error);
  });

  test('should handle spaces in path correctly', () => {
    setPlatform('darwin');
    execSyncMock.mockImplementation(() => {});

    utils.openBrowser('/path/to/my file with spaces.html');

    expect(execSyncMock).toHaveBeenCalledWith(
      'open "file:///path/to/my file with spaces.html"',
      { stdio: 'ignore' }
    );
  });
});
