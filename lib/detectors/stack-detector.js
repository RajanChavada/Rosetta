import fs from 'fs-extra';
import path from 'path';
import { detectNodeStack } from './node-detector.js';
import { detectPythonStack } from './python-detector.js';
import { detectRustStack } from './rust-detector.js';
import { detectSwiftStack } from './swift-detector.js';

const DETECTORS = [
  { name: 'node', detector: detectNodeStack, files: ['package.json'] },
  { name: 'python', detector: detectPythonStack, files: ['requirements.txt', 'pyproject.toml'] },
  { name: 'rust', detector: detectRustStack, files: ['Cargo.toml'] },
  { name: 'swift', detector: detectSwiftStack, files: ['Podfile'] },
];

export async function detectStack(cwd = process.cwd()) {
  const results = [];

  for (const { name, detector, files } of DETECTORS) {
    const hasIndicator = files.some(file => fs.pathExistsSync(path.join(cwd, file)));
    if (hasIndicator) {
      const result = await detector(cwd);
      if (result.detected) {
        results.push(result);
      }
    }
  }

  // Return highest confidence result
  if (results.length === 0) {
    return { detected: false };
  }

  results.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  });

  return results[0];
}