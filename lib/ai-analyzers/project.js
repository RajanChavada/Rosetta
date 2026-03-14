import fs from 'fs-extra';
import chalk from 'chalk';
import { AIClient } from '../ai-client.js';

/**
 * AI-based project analyzer.
 * Samples key project files and analyzes with AI.
 */
export class ProjectAnalyzer {
  constructor(options = {}) {
    this.options = {
      provider: options.provider || 'anthropic',
      apiKey: options.apiKey,
      sampleSize: options.sampleSize || 10
    };
  }

  /**
   * Sample key project files for analysis.
   */
  async sampleProjectFiles() {
    const filesToCheck = [
      'package.json',
      'README.md',
      'go.mod',
      'requirements.txt',
      'pyproject.toml',
      'Cargo.toml',
      '.ai/master-skill.md'
    ];

    const samples = [];

    for (const file of filesToCheck) {
      if (await fs.pathExists(file)) {
        try {
          const content = await fs.readFile(file, 'utf8');
          samples.push({
            file,
            content: content.substring(0, 2000) // Limit content size
          });
        } catch (err) {
          // Skip files that can't be read
        }
      }
    }

    // If no key files found, sample some source files
    if (samples.length === 0) {
      const entries = await fs.readdir('.', { withFileTypes: true });
      const sourceDirs = entries.filter(d =>
        d.isDirectory() &&
        ['src', 'lib', 'app', 'components', 'server', 'api'].includes(d.name)
      );

      for (const dir of sourceDirs.slice(0, 2)) {
        try {
          const dirFiles = await fs.readdir(dir.name);
          for (const f of dirFiles.slice(0, 3)) {
            const filePath = `${dir.name}/${f}`;
            if (f.match(/\.(js|ts|py|go|rs)$/)) {
              try {
                const content = await fs.readFile(filePath, 'utf8');
                samples.push({
                  file: filePath,
                  content: content.substring(0, 1000)
                });
                break; // One file per directory
              } catch (err) {
                // Skip
              }
            }
          }
        } catch (err) {
          // Skip
        }
      }
    }

    return samples;
  }

  /**
   * Build a formatted project sample for AI analysis.
   */
  buildProjectSample(samples) {
    if (samples.length === 0) {
      return 'No project files could be sampled.';
    }

    let output = `Project Analysis Request\n\n`;

    for (const sample of samples) {
      output += `--- ${sample.file} ---\n`;
      output += `${sample.content}\n\n`;
    }

    return output;
  }

  /**
   * Analyze the project using AI.
   */
  async analyze() {
    console.log(chalk.blue('🔍 AI Project Analysis (using your API tokens)...\n'));

    // Sample project files
    const samples = await this.sampleProjectFiles();

    if (samples.length === 0) {
      console.log(chalk.yellow('Unable to sample project files for analysis.'));
      return null;
    }

    console.log(chalk.gray(`Sampled ${samples.length} file(s) for analysis.\n`));

    // Get or load API key
    let apiKey = this.options.apiKey;
    if (!apiKey) {
      apiKey = await AIClient.loadApiKey(this.options.provider);
    }

    if (!apiKey) {
      console.log(chalk.yellow(`No ${this.options.provider.toUpperCase()} API key found.`));
      console.log(chalk.gray('Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable,'));
      console.log(chalk.gray('or run with --api-key option to enable AI analysis.'));
      return null;
    }

    // Create AI client and analyze
    const client = new AIClient(this.options.provider, apiKey);
    const projectSample = this.buildProjectSample(samples);

    const analysis = await client.analyzeProject(projectSample);

    if (analysis) {
      console.log(chalk.bold('\n📊 AI Analysis Results:\n'));
      console.log(chalk.cyan(`Purpose: ${analysis.purpose}`));
      console.log(chalk.cyan(`Frameworks: ${Array.isArray(analysis.frameworks) ? analysis.frameworks.join(', ') : analysis.frameworks}`));
      console.log(chalk.cyan(`Testing: ${analysis.testing}`));
      console.log(chalk.cyan(`Conventions: ${analysis.conventions}`));
      console.log('');

      return analysis;
    }

    return null;
  }

  /**
   * Convert AI analysis to Rosetta context.
   */
  analysisToContext(analysis) {
    if (!analysis) {
      return {};
    }

    const context = {
      description: analysis.purpose || 'Unknown project',
      detectedByAI: true
    };

    // Try to extract tech stack from analysis
    if (analysis.frameworks) {
      const frameworks = Array.isArray(analysis.frameworks)
        ? analysis.frameworks
        : [analysis.frameworks];

      context.frontend = frameworks.filter(f =>
        ['React', 'Next.js', 'Vue', 'Svelte', 'Angular'].some(name =>
          f.toLowerCase().includes(name.toLowerCase())
        )
      );

      context.backend = frameworks.filter(f =>
        ['Express', 'NestJS', 'FastAPI', 'Django', 'Rails', 'Spring', 'Go', 'Rust'].some(name =>
          f.toLowerCase().includes(name.toLowerCase())
        )
      );

      context.datastores = frameworks.filter(f =>
        ['Postgres', 'MySQL', 'MongoDB', 'Redis', 'PostgreSQL'].some(name =>
          f.toLowerCase().includes(name.toLowerCase())
        )
      );
    }

    // Extract testing info
    if (analysis.testing) {
      context.testingSetup = analysis.testing.toLowerCase().includes('e2e')
        ? 'Unit + integration + E2E'
        : analysis.testing.toLowerCase().includes('integration')
        ? 'Unit + integration'
        : 'Unit tests only';
    }

    // Store conventions for reference
    if (analysis.conventions) {
      context.aiConventions = analysis.conventions;
    }

    return context;
  }
}
