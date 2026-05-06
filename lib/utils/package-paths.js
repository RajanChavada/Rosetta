import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Root directory of the installed rosetta package.
 * Resolves to the package install location (e.g.
 * ~/.npm-global/lib/node_modules/rosettablueprint), not the user's CWD.
 */
export const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Path to a bundled definitions subdirectory (agents, personas, workflows).
 */
export function packageDefinitionsDir(kind) {
  return path.join(PACKAGE_ROOT, 'lib', 'definitions', kind);
}

/**
 * Resolve a single definition file by kind + name. Prefers a project-local
 * override (so users can drop custom defs into their project's
 * lib/definitions/<kind>/<name>.json) and falls back to the bundled package
 * definitions.
 *
 * @returns {Promise<string|null>} absolute path or null if not found
 */
export async function resolveDefinitionPath(kind, name, projectRoot) {
  const candidates = [
    projectRoot ? path.join(projectRoot, 'lib', 'definitions', kind, `${name}.json`) : null,
    path.join(packageDefinitionsDir(kind), `${name}.json`)
  ].filter(Boolean);

  for (const p of candidates) {
    if (await fs.pathExists(p)) return p;
  }
  return null;
}

/**
 * List all available definition names of a kind. Combines project-local
 * overrides with the bundled package definitions, deduped.
 */
export async function listDefinitions(kind, projectRoot) {
  const dirs = [
    packageDefinitionsDir(kind),
    projectRoot ? path.join(projectRoot, 'lib', 'definitions', kind) : null
  ].filter(Boolean);

  const seen = new Set();
  for (const dir of dirs) {
    if (!(await fs.pathExists(dir))) continue;
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (f.endsWith('.json')) seen.add(path.basename(f, '.json'));
    }
  }
  return [...seen];
}
