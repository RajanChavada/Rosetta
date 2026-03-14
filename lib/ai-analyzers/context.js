import chalk from 'chalk';
import { AIClient } from '../ai-client.js';

/**
 * AI-based context enhancer.
 * Improves project context using AI analysis.
 */
export class ContextEnhancer {
  constructor(options = {}) {
    this.options = {
      provider: options.provider || 'anthropic',
      apiKey: options.apiKey
    };
  }

  /**
   * Enhance context with AI insights.
   */
  async enhance(context) {
    const apiKey = this.options.apiKey || await AIClient.loadApiKey(this.options.provider);

    if (!apiKey) {
      console.log(chalk.yellow('AI enhancement skipped: No API key available.'));
      return context;
    }

    console.log(chalk.blue('🧠 Enhancing context with AI...\n'));

    const client = new AIClient(this.options.provider, apiKey);

    try {
      const prompt = this.buildEnhancementPrompt(context);
      const response = await client.chat([
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      // Parse AI suggestions
      const suggestions = this.parseSuggestions(response);

      if (suggestions) {
        console.log(chalk.green('✓ AI-enhanced context applied.\n'));

        // Merge suggestions into context
        return { ...context, ...suggestions, enhancedByAI: true };
      }
    } catch (err) {
      console.log(chalk.yellow(`AI enhancement failed: ${err.message}`));
    }

    return context;
  }

  /**
   * Build prompt for context enhancement.
   */
  buildEnhancementPrompt(context) {
    return `You are helping to configure an AI coding assistant. Review this project context and suggest improvements:

Current Context:
- Project Name: ${context.projectName || 'Unknown'}
- Description: ${context.description || 'Unknown'}
- Type: ${context.projectType || 'Unknown'}
- Frontend: ${Array.isArray(context.frontend) ? context.frontend.join(', ') : context.frontend || 'None'}
- Backend: ${Array.isArray(context.backend) ? context.backend.join(', ') : context.backend || 'None'}
- Datastores: ${Array.isArray(context.datastores) ? context.datastores.join(', ') : context.datastores || 'None'}
- Team Size: ${context.teamSize || 'Unknown'}
- Risk Level: ${context.riskLevel || 'Unknown'}

Respond with a JSON object suggesting:
1. Better description (concise, clear)
2. Appropriate agentStyle based on project complexity
3. editPermissions based on team size
4. Extra contexts that might be relevant

Format:
{
  "description": "improved description",
  "agentStyle": "suggested style",
  "editPermissions": "suggested permissions",
  "extras": ["relevant", "contexts"],
  "suggestions": ["additional", "tips"]
}`;
  }

  /**
   * Parse AI suggestions from response.
   */
  parseSuggestions(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          description: parsed.description,
          agentStyle: parsed.agentStyle,
          editPermissions: parsed.editPermissions,
          extras: parsed.extras || [],
          aiSuggestions: parsed.suggestions || []
        };
      }
    } catch (err) {
      // If parsing fails, return null
    }
    return null;
  }
}

/**
 * Validate AI context and provide recommendations.
 */
export class ContextValidator {
  static validate(context) {
    const issues = [];
    const warnings = [];

    // Check required fields
    if (!context.projectName) {
      issues.push('Project name is missing');
    }
    if (!context.description || context.description === 'A new project.') {
      warnings.push('Consider adding a more descriptive project description');
    }
    if (!context.projectType) {
      issues.push('Project type is not specified');
    }

    // Check consistency
    if (context.teamSize === 'Larger team (6+)' && context.editPermissions === 'Only current file') {
      warnings.push('Larger teams may benefit from broader edit permissions');
    }

    if (context.riskLevel === 'High (Critical/Financial/Healthcare)' && context.testingSetup === 'None yet') {
      warnings.push('High-risk projects should have a testing strategy');
    }

    // Check for missing stack info
    if (context.projectType === 'Web app' && (!context.frontend || context.frontend.length === 0)) {
      warnings.push('Web apps typically have a frontend stack');
    }

    if (context.projectType === 'API / backend service' && (!context.backend || context.backend.length === 0)) {
      warnings.push('Backend services should have a backend framework');
    }

    return { issues, warnings };
  }

  static reportValidation(validation) {
    if (validation.issues.length === 0 && validation.warnings.length === 0) {
      console.log(chalk.green('✓ Context is well-structured.\n'));
      return;
    }

    if (validation.issues.length > 0) {
      console.log(chalk.red('Issues found:\n'));
      validation.issues.forEach(issue => {
        console.log(chalk.red(`  ✗ ${issue}`));
      });
      console.log('');
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('Suggestions:\n'));
      validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`  ⚠ ${warning}`));
      });
      console.log('');
    }
  }
}
