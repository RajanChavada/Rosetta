import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'template.html');

/**
 * Reads and returns the HTML template string.
 * @returns {Promise<string>} The template HTML content.
 */
export async function getTemplateString() {
  return await fs.readFile(TEMPLATE_PATH, 'utf8');
}
