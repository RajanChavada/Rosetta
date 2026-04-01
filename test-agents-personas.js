#!/usr/bin/env node

// Test script for agents and personas functionality

import { spawn } from 'child_process';
import { pathExists } from 'fs-extra';
import path from 'path';

const commands = [
  {
    name: 'agent',
    args: ['architect'],
    description: 'Add architect agent'
  },
  {
    name: 'persona',
    args: ['tdd'],
    description: 'Add TDD persona'
  },
  {
    name: 'workflow',
    args: ['feature-development'],
    description: 'Add feature development workflow'
  }
];

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['cli.js', ...args], {
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ ${cmd} ${args.join(' ')}`);
        resolve(stdout);
      } else {
        console.log(`✗ ${cmd} ${args.join(' ')} failed with code ${code}`);
        reject(stderr);
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function testCommands() {
  console.log('Testing agents and personas commands...\n');

  for (const cmd of commands) {
    try {
      await runCommand(cmd.name, cmd.args);
      console.log(`  ✓ ${cmd.description}\n`);
    } catch (error) {
      console.log(`  ✗ ${cmd.description}: ${error.message}\n`);
    }
  }

  // Check if rosetta.yaml was created/updated
  if (await pathExists('rosetta.yaml')) {
    console.log('✓ rosetta.yaml exists');

    // Count definitions
    const { readFileSync } = await import('fs');
    const yaml = await import('js-yaml');
    const content = readFileSync('rosetta.yaml', 'utf8');
    const data = yaml.load(content);

    console.log(`  - Agents: ${data.agents?.length || 0}`);
    console.log(`  - Personas: ${data.personas?.length || 0}`);
    console.log(`  - Workflows: ${data.workflows?.length || 0}`);
  } else {
    console.log('✗ rosetta.yaml not found');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testCommands().catch(console.error);
}