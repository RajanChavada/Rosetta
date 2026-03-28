/**
 * Metadata handling for Rosetta configurations
 */

/**
 * Create default metadata
 * @param {Object} options - Options for metadata creation
 * @returns {Object} Metadata object
 */
export function createMetadata(options = {}) {
  const now = new Date().toISOString();

  return {
    created_at: options.createdAt || now,
    updated_at: options.updatedAt || now,
    version: options.version || '1.0.0',
    source: options.source || null,
    migrations: options.migrations || []
  };
}

/**
 * Update metadata with new timestamp
 * @param {Object} metadata - Existing metadata
 * @returns {Object} Updated metadata
 */
export function updateMetadata(metadata = {}) {
  return {
    ...metadata,
    updated_at: new Date().toISOString()
  };
}

/**
 * Add migration record to metadata
 * @param {Object} metadata - Existing metadata
 * @param {string} from - Source format
 * @param {string} to - Target format
 * @returns {Object} Updated metadata
 */
export function addMigrationRecord(metadata, from, to) {
  const migrations = metadata.migrations || [];

  return {
    ...metadata,
    migrations: [
      ...migrations,
      {
        from,
        to,
        timestamp: new Date().toISOString()
      }
    ],
    updated_at: new Date().toISOString()
  };
}

/**
 * Extract metadata for IDE-specific output
 * @param {Object} metadata - Full metadata object
 * @param {string} format - Target format (yaml, markdown, etc.)
 * @returns {string} Formatted metadata string
 */
export function formatMetadata(metadata, format = 'markdown') {
  if (format === 'yaml') {
    return formatMetadataAsYaml(metadata);
  }

  return formatMetadataAsMarkdown(metadata);
}

/**
 * Format metadata as YAML comment block
 */
function formatMetadataAsYaml(metadata) {
  const lines = ['# Rosetta Metadata'];

  if (metadata.created_at) {
    lines.push(`# Created: ${metadata.created_at}`);
  }

  if (metadata.updated_at) {
    lines.push(`# Updated: ${metadata.updated_at}`);
  }

  if (metadata.version) {
    lines.push(`# Version: ${metadata.version}`);
  }

  if (metadata.source) {
    lines.push(`# Source: ${metadata.source}`);
  }

  return lines.join('\n');
}

/**
 * Format metadata as markdown comment block
 */
function formatMetadataAsMarkdown(metadata) {
  const lines = ['<!--'];

  lines.push('  Rosetta Metadata');
  lines.push('');

  if (metadata.created_at) {
    lines.push(`  Created: ${metadata.created_at}`);
  }

  if (metadata.updated_at) {
    lines.push(`  Updated: ${metadata.updated_at}`);
  }

  if (metadata.version) {
    lines.push(`  Version: ${metadata.version}`);
  }

  if (metadata.source) {
    lines.push(`  Source: ${metadata.source}`);
  }

  lines.push('-->');

  return lines.join('\n');
}
