import fs from 'fs-extra';
import path from 'path';

export async function recursiveGlob(dir, pattern) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip common ignores
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '.venv', 'venv'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subResults = await recursiveGlob(fullPath, pattern);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Simple pattern: '**/*.tf' → match file extension
      const ext = pattern.split('.').pop();
      if (entry.name.endsWith(`.${ext}`)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}
