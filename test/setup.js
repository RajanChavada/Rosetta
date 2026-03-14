/**
 * Jest Setup File for ESM Module Mocking
 *
 * This file sets up proper mocks for ESM modules like fs-extra and inquirer
 */
import { jest } from '@jest/globals';


// Mock fs-extra
jest.unstable_mockModule('fs-extra', () => {
  const mock = {
    pathExists: jest.fn(),
    readJson: jest.fn(),
    writeJson: jest.fn(),
    ensureDir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    copy: jest.fn(),
    remove: jest.fn(),
    symlink: jest.fn(),
    appendFile: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn()
  };
  return { ...mock, default: mock };
});

// Mock inquirer
jest.unstable_mockModule('inquirer', () => {
  const mock = {
    prompt: jest.fn()
  };
  return { ...mock, default: mock };
});

// Mock chalk
jest.unstable_mockModule('chalk', () => {
  const mock = {
    blue: jest.fn((str) => str),
    green: jest.fn((str) => str),
    yellow: jest.fn((str) => str),
    red: jest.fn((str) => str),
    gray: jest.fn((str) => str),
    cyan: jest.fn((str) => str),
    magenta: jest.fn((str) => str),
    bold: {
      green: jest.fn((str) => str),
      blue: jest.fn((str) => str),
      yellow: jest.fn((str) => str),
      red: jest.fn((str) => str)
    }
  };
  return { ...mock, default: mock };
});

// Mock child_process
jest.unstable_mockModule('child_process', () => {
  const mock = {
    execSync: jest.fn()
  };
  return { ...mock, default: mock };
});

// Mock https
jest.unstable_mockModule('https', () => {
  const mock = {
    get: jest.fn()
  };
  return { ...mock, default: mock };
});

// Mock http
jest.unstable_mockModule('http', () => {
  const mock = {
    get: jest.fn()
  };
  return { ...mock, default: mock };
});

// Mock chokidar
jest.unstable_mockModule('chokidar', () => {
  const mock = {
    watch: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      close: jest.fn()
    }))
  };
  return { ...mock, default: mock };
});
