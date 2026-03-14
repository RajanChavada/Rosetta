#!/usr/bin/env node

/**
 * Simple test runner for ideation system tests
 * This bypasses jest complexity and runs basic tests directly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${message}`);
  } else {
    failedTests++;
    console.error(`✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`✓ ${message}`);
  } else {
    failedTests++;
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
  }
}

// Mock console to suppress output
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function suppressConsole() {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

function restoreConsole() {
  console.log = originalLog;
  console.error = originalError;
  console.warn = originalWarn;
}

async function runTestFile(testPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${testPath}`);
  console.log('='.repeat(60));

  try {
    const testModule = await import(testPath);
    if (testModule.default) {
      await testModule.default({ assert, assertEqual, suppressConsole, restoreConsole });
    }
  } catch (error) {
    console.error(`Error running test file: ${error.message}`);
    console.error(error.stack);
    failedTests++;
  }
}

async function main() {
  console.log('🧪 Running Ideation System Tests');
  console.log('=' .repeat(60));

  const testFiles = [
    'test/ideation-unit.test.js',
    'test/analyzers/dependency-analyzer-unit.test.js',
    'test/analyzers/code-pattern-analyzer-unit.test.js',
    'test/generators/skill-generator-unit.test.js',
    'test/generators/relevance-scorer-unit.test.js',
    'test/commands/ideate-unit.test.js'
  ];

  for (const testFile of testFiles) {
    const fullPath = join(__dirname, testFile);
    if (fs.existsSync(fullPath)) {
      await runTestFile(fullPath);
    } else {
      console.log(`⚠ Test file not found: ${testFile}`);
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests:  ${totalTests}`);
  console.log(`Passed:       ${passedTests} ✓`);
  console.log(`Failed:       ${failedTests} ✗`);
  console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(60));

  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
