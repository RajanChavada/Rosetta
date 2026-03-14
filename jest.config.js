/**
 * Jest Configuration for Rosetta CLI
 *
 * Using Jest with ESM modules (type: module in package.json)
 */

export default {
  // Module settings for ESM
  preset: null,
  transform: {},
  testEnvironment: 'node',

  // Module resolution
  moduleFileExtensions: ['js', 'json'],
  testMatch: [
    '**/test/**/*.test.js'
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Verbose output for better debugging
  verbose: false,

  // Timeout for async operations
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],

  // Global setup/teardown
  setupFiles: ['./test/setup.js'],

  // Exclude patterns for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ]
};
