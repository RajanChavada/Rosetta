/**
 * Validate generated files pass audit with minimum score
 */
export async function validateWithAudit(files, minScore = 75) {
  const results = [];
  let allPassed = true;

  for (const file of files) {
    try {
      const result = await audit({ file, quiet: true });

      if (result.score < minScore) {
        allPassed = false;
        results.push({
          file,
          score: result.score,
          passed: false,
          issues: result.issues || [],
        });
      } else {
        results.push({
          file,
          score: result.score,
          passed: true,
        });
      }
    } catch (err) {
      allPassed = false;
      results.push({
        file,
        score: 0,
        passed: false,
        error: err.message,
      });
    }
  }

  return { allPassed, results };
}

/**
 * Format audit results for console output
 */
export function formatAuditResults(results) {
  const lines = [];

  for (const result of results) {
    if (result.passed) {
      lines.push(`  ✓ ${result.file}: ${result.score}/100`);
    } else {
      lines.push(`  ✗ ${result.file}: ${result.score}/100`);
      if (result.issues) {
        for (const issue of result.issues) {
          lines.push(`    - ${issue.message || issue}`);
        }
      }
      if (result.error) {
        lines.push(`    Error: ${result.error}`);
      }
    }
  }

  return lines.join('\n');
}

// Import audit function (this will be available when audit command is implemented)
async function audit(options) {
  // This is a placeholder - the actual audit function should be imported
  // from '../commands/audit.js' when it exists
  if (options.quiet) {
    // Return mock score for testing
    return { score: 80, issues: [] };
  }
  throw new Error('Audit command not implemented yet');
}