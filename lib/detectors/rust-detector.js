import fs from 'fs-extra';
import path from 'path';

export async function detectRustStack(cwd) {
  const cargoPath = path.join(cwd, 'Cargo.toml');

  if (!(await fs.pathExists(cargoPath))) {
    return { detected: false };
  }

  // Rust support is minimal for now
  return {
    detected: false, // Will implement fully in future
  };
}
