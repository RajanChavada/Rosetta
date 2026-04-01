import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectVariables } from './variable-injector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_BASE_DIR = path.resolve(__dirname, '../../templates');

const IDE_BLOCK_OPEN = /{{#IDE\s+(\w+)}}/;
const IDE_BLOCK_CLOSE = '{{/IDE}}';

export function extractIDESection(template, targetIDE) {
  const lines = template.split('\n');
  const result = [];
  let inTargetBlock = false;
  let inOtherBlock = false;
  let blockDepth = 0;

  for (const line of lines) {
    const openMatch = line.match(IDE_BLOCK_OPEN);

    // Check for target IDE open tag
    if (openMatch && openMatch[1] === targetIDE) {
      inTargetBlock = true;
      continue;
    }

    // Check for other IDE open tag
    if (openMatch && openMatch[1] !== targetIDE) {
      inOtherBlock = true;
      blockDepth++;
      continue;
    }

    // Check for close tag
    if (line.includes(IDE_BLOCK_CLOSE)) {
      if (inTargetBlock) {
        inTargetBlock = false;
        continue;
      }
      if (inOtherBlock) {
        blockDepth--;
        if (blockDepth === 0) {
          inOtherBlock = false;
        }
        continue;
      }
    }

    // Include line if not in other IDE block
    if (!inOtherBlock) {
      result.push(line);
    }
  }

  // Trim trailing empty lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.join('\n');
}

export async function compileStackTemplate(stack, ide, context) {
  // Try IDE-specific template first
  const templatePath = path.join(TEMPLATES_BASE_DIR, ide, `${stack}.md`);

  // Fall back to Claude template if IDE-specific doesn't exist
  let fallbackPath = path.join(TEMPLATES_BASE_DIR, 'claude', `${stack}.md`);
  if (ide !== 'claude') {
    fallbackPath = path.join(TEMPLATES_BASE_DIR, 'claude', `${stack}.md`);
  }

  const actualPath = (await fs.pathExists(templatePath)) ? templatePath : fallbackPath;

  if (!(await fs.pathExists(actualPath))) {
    throw new Error(`Template not found: ${actualPath}`);
  }

  const template = await fs.readFile(actualPath, 'utf-8');
  const ideSpecific = extractIDESection(template, ide);
  const compiled = injectVariables(ideSpecific, context);

  return compiled;
}

export async function listAvailableStacks() {
  // Check claude templates as the base
  const templatesDir = path.resolve(TEMPLATES_BASE_DIR, 'claude');

  if (!(await fs.pathExists(templatesDir))) {
    return [];
  }

  const files = await fs.readdir(templatesDir);
  const stacks = files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  // Validate that stack detectors exist for these stacks
  const validStacks = [];
  for (const stack of stacks) {
    const detectorMap = {
      'next.js': 'node',
      'react-vite': 'node',
      'node-api': 'node',
      'python-fastapi': 'python',
      'swift-ios': 'swift'
    };

    if (detectorMap[stack] && (await fs.pathExists(`lib/detectors/${detectorMap[stack]}-detector.js`))) {
      validStacks.push(stack);
    }
  }

  return validStacks;
}