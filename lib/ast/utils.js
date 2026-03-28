/**
 * AST Utility Functions
 *
 * Helper functions for diffing and merging AST objects
 */

/**
 * Deep diff two objects
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object to compare against
 * @returns {Object} Diff result with summary and detailed changes
 */
export function diffObjects(obj1, obj2) {
  const result = {
    summary: {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    },
    changes: {}
  };

  // Collect all keys from both objects
  const allKeys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {})
  ]);

  for (const key of allKeys) {
    const val1 = obj1?.[key];
    const val2 = obj2?.[key];

    // Key only in obj2 - added
    if (!(key in obj1)) {
      result.summary.added++;
      result.changes[key] = {
        status: 'added',
        value: val2
      };
      continue;
    }

    // Key only in obj1 - removed
    if (!(key in obj2)) {
      result.summary.removed++;
      result.changes[key] = {
        status: 'removed',
        value: val1
      };
      continue;
    }

    // Both have the key - compare values
    if (isObject(val1) && isObject(val2)) {
      // Recursive diff for nested objects
      const nestedDiff = diffObjects(val1, val2);

      if (Object.keys(nestedDiff.changes).length > 0) {
        result.summary.modified += nestedDiff.summary.modified;
        result.summary.added += nestedDiff.summary.added;
        result.summary.removed += nestedDiff.summary.removed;
        result.summary.unchanged += nestedDiff.summary.unchanged;
        result.changes[key] = nestedDiff;
      } else {
        result.summary.unchanged++;
      }
    } else if (Array.isArray(val1) && Array.isArray(val2)) {
      // Array comparison - treat empty vs non-empty as added/removed
      const isEmpty1 = val1.length === 0;
      const isEmpty2 = val2.length === 0;

      if (isEmpty1 && !isEmpty2) {
        // Added: source has items, target empty
        result.summary.added++;
        result.changes[key] = {
          status: 'added',
          value: val2
        };
      } else if (!isEmpty1 && isEmpty2) {
        // Removed: target had items, source empty
        result.summary.removed++;
        result.changes[key] = {
          status: 'removed',
          value: val1
        };
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        // Both non-empty and different -> modified
        result.summary.modified++;
        result.changes[key] = {
          status: 'modified',
          oldValue: val1,
          newValue: val2
        };
      } else {
        result.summary.unchanged++;
      }
    } else if (val1 !== val2) {
      // Primitive value difference
      result.summary.modified++;
      result.changes[key] = {
        status: 'modified',
        oldValue: val1,
        newValue: val2
      };
    } else {
      // No change
      result.summary.unchanged++;
    }
  }

  return result;
}

/**
 * Merge two objects with strategy
 * @param {Object} target - Target object (values preserved based on strategy)
 * @param {Object} source - Source object (values to merge in)
 * @param {string} strategy - Merge strategy: 'canonical', 'preserve', 'timestamp'
 * @returns {Object} Merged object
 */
export function mergeObjects(target, source, strategy = 'canonical') {
  const result = { ...target };

  for (const key of Object.keys(source || {})) {
    const targetVal = target?.[key];
    const sourceVal = source[key];

    // Skip if source value is undefined/null
    if (sourceVal === undefined || sourceVal === null) {
      continue;
    }

    // Key not in target - add from source
    if (!(key in target) || targetVal === undefined || targetVal === null) {
      result[key] = deepClone(sourceVal);
      continue;
    }

    // Both values are objects - recurse
    if (isObject(targetVal) && isObject(sourceVal)) {
      result[key] = mergeObjects(targetVal, sourceVal, strategy);
      continue;
    }

    // Arrays - merge based on strategy
    if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
      if (strategy === 'preserve') {
        // Keep target unless target is empty, then adopt source
        if (targetVal.length === 0) {
          result[key] = deepClone(sourceVal);
        } else {
          result[key] = deepClone(targetVal);
        }
      } else if (strategy === 'timestamp') {
        // Use source (assumed newer)
        result[key] = deepClone(sourceVal);
      } else {
        // Canonical: prefer target, but if target is empty, use source
        if (targetVal.length === 0) {
          result[key] = deepClone(sourceVal);
        } else {
          result[key] = deepClone(targetVal);
        }
      }
      continue;
    }

    // Primitive values - use strategy
    if (strategy === 'preserve') {
      // Keep target value
      result[key] = targetVal;
    } else if (strategy === 'timestamp') {
      // Use source value (assumed newer)
      result[key] = sourceVal;
    } else {
      // Canonical: prefer target
      result[key] = targetVal;
    }
  }

  return result;
}

/**
 * Check if value is a plain object (not array, not null)
 * @param {*} value
 * @returns {boolean}
 */
function isObject(value) {
  return typeof value === 'object' &&
         value !== null &&
         !Array.isArray(value) &&
         !(value instanceof Date) &&
         !(value instanceof RegExp);
}

/**
 * Deep clone a value
 * @param {*} value
 * @returns {*}
 */
export function deepClone(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepClone(item));
  }

  const cloned = {};
  for (const key of Object.keys(value)) {
    cloned[key] = deepClone(value[key]);
  }
  return cloned;
}

/**
 * Format a diff result as a readable string
 * @param {Object} diff - Diff result from diffObjects
 * @param {string} indent - Indentation for nested output
 * @returns {string} Formatted diff string
 */
export function formatDiff(diff, indent = '') {
  const lines = [];

  // Summary
  const { summary } = diff;
  lines.push(`${indent}Summary:`);
  lines.push(`${indent}  Added: ${summary.added}`);
  lines.push(`${indent}  Removed: ${summary.removed}`);
  lines.push(`${indent}  Modified: ${summary.modified}`);
  lines.push(`${indent}  Unchanged: ${summary.unchanged}`);

  // Changes
  if (Object.keys(diff.changes).length > 0) {
    lines.push(`${indent}Changes:`);
    formatChanges(diff.changes, lines, indent + '  ');
  }

  return lines.join('\n');
}

/**
 * Format changes recursively
 * @private
 */
function formatChanges(changes, lines, indent) {
  for (const [key, change] of Object.entries(changes)) {
    if (change.status) {
      // Leaf change
      if (change.status === 'added') {
        lines.push(`${indent}+ ${key}: ${JSON.stringify(change.value)}`);
      } else if (change.status === 'removed') {
        lines.push(`${indent}- ${key}: ${JSON.stringify(change.value)}`);
      } else if (change.status === 'modified') {
        lines.push(`${indent}* ${key}:`);
        lines.push(`${indent}    - ${JSON.stringify(change.oldValue)}`);
        lines.push(`${indent}    + ${JSON.stringify(change.newValue)}`);
      }
    } else {
      // Nested diff
      const hasChanges = Object.values(change).some(
        c => c.status || (c.summary && (c.summary.added + c.summary.removed + c.summary.modified) > 0)
      );

      if (hasChanges) {
        lines.push(`${indent}${key}/`);
        formatChanges(change.changes || change, lines, indent + '  ');
      }
    }
  }
}
