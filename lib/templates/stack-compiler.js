import fs from 'fs-extra';
import path from 'path';
import { injectVariables } from './variable-injector.js';

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
  const templatePath = path.resolve('templates/stacks', `${stack}.md`);

  if (!(await fs.pathExists(templatePath))) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const template = await fs.readFile(templatePath, 'utf-8');
  const ideSpecific = extractIDESection(template, ide);
  const compiled = injectVariables(ideSpecific, context);

  return compiled;
}

export async function listAvailableStacks() {
  const templatesDir = path.resolve('templates/stacks');

  if (!(await fs.pathExists(templatesDir))) {
    return [];
  }

  const files = await fs.readdir(templatesDir);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}