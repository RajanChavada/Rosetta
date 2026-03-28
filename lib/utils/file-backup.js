import fs from 'fs-extra';
import path from 'path';

/**
 * Backup a file by appending .bak suffix
 * If .bak already exists, appends timestamp
 */
export async function backupFile(filePath) {
  if (!(await fs.pathExists(filePath))) {
    return null;
  }

  let backupPath = `${filePath}.bak`;

  // If backup exists, add timestamp
  if (await fs.pathExists(backupPath)) {
    const timestamp = Date.now();
    backupPath = `${filePath}.bak.${timestamp}`;
  }

  await fs.copy(filePath, backupPath);
  return backupPath;
}

/**
 * Restore a file from backup
 */
export async function restoreFromBackup(backupPath) {
  const originalPath = backupPath.replace(/\.bak(\.\d+)?$/, '');

  if (!(await fs.pathExists(backupPath))) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  await fs.copy(backupPath, originalPath, { overwrite: true });
  return originalPath;
}