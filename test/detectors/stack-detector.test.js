import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

// Mock before importing stack-detector
const mockDetectNodeStack = jest.fn();
const mockDetectPythonStack = jest.fn();
const mockDetectRustStack = jest.fn();
const mockDetectSwiftStack = jest.fn();

jest.mock('../../lib/detectors/node-detector.js', () => ({
  detectNodeStack: mockDetectNodeStack
}));

jest.mock('../../lib/detectors/python-detector.js', () => ({
  detectPythonStack: mockDetectPythonStack
}));

jest.mock('../../lib/detectors/rust-detector.js', () => ({
  detectRustStack: mockDetectRustStack
}));

jest.mock('../../lib/detectors/swift-detector.js', () => ({
  detectSwiftStack: mockDetectSwiftStack
}));

// Now import the stack detector which will use our mocks
import { detectStack } from '../../lib/detectors/stack-detector.js';

describe('detectStack', () => {
  const testDir = '/tmp/rosetta-stack-test';

  beforeEach(() => {
    jest.clearAllMocks();

    // Clean up and recreate test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should detect next.js stack from package.json', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-app',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start'
      },
      dependencies: {
        'next': '^13.0.0'
      }
    };
    await import('fs').then(fs =>
      fs.writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    );

    // Mock node detector
    mockDetectNodeStack.mockResolvedValue({
      detected: true,
      stack: 'next.js',
      confidence: 'high',
      framework: 'next',
      buildTool: 'turbopack'
    });

    const result = await detectStack(testDir);
    expect(result.detected).toBe(true);
    expect(result.stack).toBe('next.js');
    expect(result.confidence).toBe('high');
  });

  it('should return detected: false for unknown project', async () => {
    // Empty directory
    const result = await detectStack(testDir);
    expect(result.detected).toBe(false);
  });

  it('should detect react-vite stack', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-app',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        'react': '^18.0.0',
        'vite': '^4.0.0'
      }
    };
    await import('fs').then(fs =>
      fs.writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2))
    );

    // Mock node detector returning react-vite result
    mockDetectNodeStack.mockResolvedValue({
      detected: true,
      stack: 'react-vite',
      confidence: 'high',
      framework: 'react',
      buildTool: 'vite'
    });

    const result = await detectStack(testDir);
    expect(result.detected).toBe(true);
    expect(result.stack).toBe('react-vite');
    expect(result.framework).toBe('react');
    expect(result.buildTool).toBe('vite');
  });

  it('should return highest confidence result when multiple stacks detected', async () => {
    // Create both package.json and requirements.txt
    const packageJson = {
      name: 'test-app',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev'
      },
      dependencies: {
        'next': '^13.0.0'
      }
    };
    await import('fs').then(fs => {
      fs.writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
      fs.writeFileSync(join(testDir, 'requirements.txt'), 'Django==4.0.0\n');
    });

    // Mock detectors with different confidence levels
    mockDetectNodeStack.mockResolvedValue({
      detected: true,
      stack: 'next.js',
      confidence: 'high'
    });

    mockDetectPythonStack.mockResolvedValue({
      detected: true,
      stack: 'django',
      confidence: 'high'
    });

    const result = await detectStack(testDir);
    // Since both have high confidence, the first one detected wins
    expect(result.detected).toBe(true);
    expect(['next.js', 'django']).toContain(result.stack);
    expect(result.confidence).toBe('high');
  });
});