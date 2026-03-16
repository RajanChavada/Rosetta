import chalk from 'chalk';
import { loadCatalog, filterByDomain } from '../catalog.js';
import { TreeLogger } from '../utils.js';

/**
 * Command: catalog
 * List all skills in the catalog with optional filtering.
 */
export async function catalog(options = {}) {
  const {
    json = false,
    domain,
    limit,
    // Dry run is accepted for compatibility but has no effect
    dryRun
  } = options;

  // Use silent logger when JSON output is requested
  const logger = json ? {
    logStep: () => {},
    log: () => {}
  } : new TreeLogger('Loading catalog');

  try {
    // Load catalog or filter by domain
    logger.logStep('Loading catalog data...');
    let skills;

    try {
      if (domain) {
        // Filter by domain(s) - can be comma-separated string or array
        const domains = Array.isArray(domain) ? domain : domain.split(',').map(d => d.trim());
        skills = await filterByDomain(domains);
      } else {
        const catalog = await loadCatalog();
        skills = catalog.skills;
      }

      // Apply limit if specified
      if (limit && typeof limit === 'number') {
        skills = skills.slice(0, limit);
      }
    } catch (err) {
      // Error loading catalog
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }

    // Output results
    if (json) {
      console.log(JSON.stringify({
        count: skills.length,
        skills: skills
      }, null, 2));
      return;
    }

    // Table format
    console.log('');
    console.log(chalk.blue.bold(`📦 Catalog: ${skills.length} skill(s)\n`));

    if (skills.length === 0) {
      console.log(chalk.yellow('No skills found.'));
      return;
    }

    // Calculate column widths
    const nameWidth = Math.max(25, ...skills.map(s => s.name.length));
    const descWidth = Math.max(40, ...skills.map(s => Math.min(s.description.length, 50)));

    // Print table header
    const header = `┝${'─'.repeat(nameWidth + 2)}┬${'─'.repeat(descWidth + 2)}┬${'─'.repeat(25)}┑`;
    console.log(chalk.gray(header));
    console.log(chalk.gray(`│ ${chalk.bold('Name').padEnd(nameWidth)} │ ${chalk.bold('Description').padEnd(descWidth)} │ ${chalk.bold('Domains').padEnd(23)} │`));
    console.log(chalk.gray(`├${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(descWidth + 2)}┼${'─'.repeat(25)}┤`));

    // Print skills
    skills.forEach((skill, index) => {
      const nameCell = skill.name.padEnd(nameWidth);
      const descPreview = skill.description.length > descWidth
        ? skill.description.substring(0, descWidth - 3) + '...'
        : skill.description.padEnd(descWidth);
      const domainsStr = skill.domains.slice(0, 2).join(', ');
      const domainsDisplay = domainsStr.padEnd(23);

      const line = `│ ${chalk.cyan(nameCell)} │ ${chalk.white(descPreview)} │ ${chalk.yellow(domainsDisplay)} │`;

      // Last row gets different border
      if (index === skills.length - 1) {
        const footer = `└${'─'.repeat(nameWidth + 2)}┴${'─'.repeat(descWidth + 2)}┴${'─'.repeat(25)}┘`;
        console.log(line);
        console.log(chalk.gray(footer));
      } else {
        console.log(line);
        console.log(chalk.gray(`├${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(descWidth + 2)}┼${'─'.repeat(25)}┤`));
      }
    });

    console.log('');

    // If we filtered by domain, show the domains we used
    if (domain && !json) {
      const domainList = Array.isArray(domain) ? domain : domain.split(',');
      console.log(chalk.gray(`Filtered by domain(s): ${domainList.join(', ')}`));
      console.log('');
    }

    // Show hint about detailed view
    if (skills.length > 0 && !json) {
      console.log(chalk.gray('Use --json for full details including repoUrl, lastUpdated, and tags.'));
    }

  } catch (err) {
    console.error(chalk.red(`Unexpected error: ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  }
}
