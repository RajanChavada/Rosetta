/**
 * Unit tests for code-pattern-analyzer.js - Simple version without Jest
 */

export default function testCodePatternAnalyzer({ assert }) {
  console.log('\nTesting code-pattern-analyzer.js module exports...');

  (async () => {
    try {
      const module = await import('../../lib/analyzers/code-pattern-analyzer.js');

      // Test exported functions
      assert(typeof module.analyzeCodePatterns === 'function', 'analyzeCodePatterns function is exported');

      // Test that function accepts correct parameters
      assert(module.analyzeCodePatterns.length === 1, 'analyzeCodePatterns accepts 1 parameter');

    } catch (error) {
      console.error('Error importing code-pattern-analyzer module:', error.message);
      assert(false, 'Can import code-pattern-analyzer module');
    }
  })();
}
