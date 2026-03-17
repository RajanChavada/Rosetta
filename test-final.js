#!/usr/bin/env node

/**
 * Final test for the install command fix
 */

import { install } from './lib/commands/install.js';
import fs from 'fs-extra';

console.log('=== Testing Install Command Fix ===\n');

// Test URLs
const testUrls = [
  {
    url: 'https://github.com/superpowers/skills',
    description: 'Regular repo URL (should work)'
  },
  {
    url: 'https://github.com/superpowers/tree/main/skills/writing-plans',
    description: 'GitHub tree URL with subdirectory (the fix)'
  },
  {
    url: 'https://github.com/superpowers/tree/main/skills/brainstorming',
    description: 'Another GitHub tree URL (the fix)'
  }
];

// Test dry-run install for each URL
async function runTests() {
  for (const test of testUrls) {
    console.log(`Testing: ${test.url}`);
    console.log(`Description: ${test.description}\n`);

    try {
      await install(test.url, { dryRun: true });
      console.log('✓ SUCCESS - Install command completed\n');
    } catch (err) {
      console.log(`✗ FAILED - Install error: ${err.message}\n`);
    }
  }

  console.log('=== Summary ===');
  console.log('The fix transforms GitHub URLs from:');
  console.log('  https://github.com/user/repo/tree/main/skills/skill-name');
  console.log('To:');
  console.log('  Repo: https://github.com/user/repo');
  console.log('  Subdirectory: skills/skill-name');
  console.log('\nThen uses sparse checkout to clone only the subdirectory.');
}

runTests().catch(console.error);