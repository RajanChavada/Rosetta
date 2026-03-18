import fs from 'fs-extra';
import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escapes HTML special characters to prevent XSS.
 * Replaces &, <, >, ", ' with their HTML entities.
 *
 * @param {any} str - The string to escape (will be converted to string)
 * @returns {string} - Escaped HTML-safe string
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes JSON string for safe embedding in <script> tags.
 * Prevents breaking out of script context and XSS attacks.
 *
 * @param {string} jsonString - The JSON string to escape
 * @returns {string} - Escaped JSON string safe for script embedding
 */
export function escapeJsonForScript(jsonString) {
  return jsonString
    .replace(/</g, '\\u003c') // Prevent </script> break
    .replace(/\u2028/g, '\\u2028') // Line separator
    .replace(/\u2029/g, '\\u2029'); // Paragraph separator
}

/**
 * Reads an HTML template file and returns its contents as a string.
 *
 * @param {string} filePath - Path to the template file
 * @returns {Promise<string>} - Template content as UTF-8 string
 * @throws {Error} - If file cannot be read, with chalk-formatted message
 */
export async function readTemplate(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (err) {
    throw new Error(chalk.red(`Error reading template ${filePath}: ${err.message}`));
  }
}

/**
 * Opens a file in the system's default browser.
 * Cross-platform support: darwin (open), win32 (start), linux (xdg-open).
 *
 * @param {string} filePath - Path to the HTML file to open
 * @throws {Error} - If browser cannot be opened
 */
export function openBrowser(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const url = `file://${absolutePath}`;
    let command;

    switch (process.platform) {
      case 'darwin':
        command = `open "${url}"`;
        break;
      case 'win32':
        command = `start "${url}"`;
        break;
      case 'linux':
        command = `xdg-open "${url}"`;
        break;
      default:
        command = `xdg-open "${url}"`;
    }

    execSync(command, { stdio: 'ignore' });
  } catch (err) {
    throw new Error(chalk.red(`Failed to open browser: ${err.message}`));
  }
}
