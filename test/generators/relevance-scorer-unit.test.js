/**
 * Unit tests for relevance-scorer.js - Simple version without Jest
 */

export default function testRelevanceScorer({ assert }) {
  console.log('\nTesting relevance-scorer.js module exports...');

  (async () => {
    try {
      const module = await import('../../lib/generators/relevance-scorer.js');

      // Test exported functions
      assert(typeof module.scoreSkill === 'function', 'scoreSkill function is exported');
      assert(typeof module.scoreAllSkills === 'function', 'scoreAllSkills function is exported');
      assert(typeof module.diversifyByDomains === 'function', 'diversifyByDomains function is exported');
      assert(typeof module.displayScoredSkills === 'function', 'displayScoredSkills function is exported');

      // Test constants
      assert(module.SCORING_WEIGHTS !== undefined, 'SCORING_WEIGHTS constant is exported');
      assert(module.CONFIDENCE_THRESHOLDS !== undefined, 'CONFIDENCE_THRESHOLDS constant is exported');

      // Test scoring weights
      assert(module.SCORING_WEIGHTS.FRAMEWORK_MATCH === 30, 'FRAMEWORK_MATCH weight is 30');
      assert(module.SCORING_WEIGHTS.DEPENDENCY_MATCH === 20, 'DEPENDENCY_MATCH weight is 20');
      assert(module.SCORING_WEIGHTS.TESTING_MATCH === 15, 'TESTING_MATCH weight is 15');
      assert(module.SCORING_WEIGHTS.PROJECT_TYPE_MATCH === 15, 'PROJECT_TYPE_MATCH weight is 15');
      assert(module.SCORING_WEIGHTS.PATTERN_MATCH === 10, 'PATTERN_MATCH weight is 10');
      assert(module.SCORING_WEIGHTS.DOMAIN_RELEVANCE === 10, 'DOMAIN_RELEVANCE weight is 10');

      // Test confidence thresholds
      assert(module.CONFIDENCE_THRESHOLDS.HIGH === 70, 'HIGH threshold is 70');
      assert(module.CONFIDENCE_THRESHOLDS.MEDIUM === 50, 'MEDIUM threshold is 50');
      assert(module.CONFIDENCE_THRESHOLDS.LOW === 30, 'LOW threshold is 30');

      // Test that functions accept correct parameters
      assert(module.scoreSkill.length >= 2, 'scoreSkill accepts correct parameters');
      assert(module.scoreAllSkills.length >= 2, 'scoreAllSkills accepts correct parameters');
      assert(module.diversifyByDomains.length >= 2, 'diversifyByDomains accepts correct parameters');
      assert(module.displayScoredSkills.length >= 1, 'displayScoredSkills accepts correct parameters');

      // Test basic scoring functionality
      const mockSkill = {
        name: 'test-skill',
        requiredFrameworks: ['express'],
        domains: ['backend']
      };

      const mockAnalysisResults = {
        dependencies: {
          allFrameworks: ['express'],
          allDependencies: { express: '^4.18.0' }
        },
        patterns: {
          testing: { hasTests: false, frameworks: [] },
          directories: {}
        },
        context: {
          projectType: 'web application'
        }
      };

      const result = module.scoreSkill(mockSkill, mockAnalysisResults);

      assert(result !== undefined, 'scoreSkill returns a result');
      assert(typeof result.score === 'number', 'scoreSkill returns numeric score');
      assert(Array.isArray(result.reasons), 'scoreSkill returns reasons array');
      assert(typeof result.confidence === 'string', 'scoreSkill returns confidence string');

    } catch (error) {
      console.error('Error importing relevance-scorer module:', error.message);
      assert(false, 'Can import relevance-scorer module');
    }
  })();
}
