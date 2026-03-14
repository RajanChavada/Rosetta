/**
 * Unit tests for dependency-analyzer.js - Simple version without Jest
 */

export default function testDependencyAnalyzer({ assert, assertEqual }) {
  console.log('\nTesting dependency-analyzer.js module exports...');

  (async () => {
    try {
      const module = await import('../../lib/analyzers/dependency-analyzer.js');

      // Test exported functions
      assert(typeof module.parseNodeDependencies === 'function', 'parseNodeDependencies function is exported');
      assert(typeof module.parseGoDependencies === 'function', 'parseGoDependencies function is exported');
      assert(typeof module.parsePythonDependencies === 'function', 'parsePythonDependencies function is exported');
      assert(typeof module.parseRustDependencies === 'function', 'parseRustDependencies function is exported');
      assert(typeof module.parseRubyDependencies === 'function', 'parseRubyDependencies function is exported');
      assert(typeof module.analyzeDependencies === 'function', 'analyzeDependencies function is exported');

      // Test that functions accept correct parameters
      assert(module.parseNodeDependencies.length === 1, 'parseNodeDependencies accepts 1 parameter');
      assert(module.parseGoDependencies.length === 1, 'parseGoDependencies accepts 1 parameter');
      assert(module.parsePythonDependencies.length === 1, 'parsePythonDependencies accepts 1 parameter');
      assert(module.parseRustDependencies.length === 1, 'parseRustDependencies accepts 1 parameter');
      assert(module.parseRubyDependencies.length === 1, 'parseRubyDependencies accepts 1 parameter');
      assert(module.analyzeDependencies.length === 1, 'analyzeDependencies accepts 1 parameter');

    } catch (error) {
      console.error('Error importing dependency-analyzer module:', error.message);
      assert(false, 'Can import dependency-analyzer module');
    }
  })();
}
