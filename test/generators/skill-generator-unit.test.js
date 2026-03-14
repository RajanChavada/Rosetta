/**
 * Unit tests for skill-generator.js - Simple version without Jest
 */

export default function testSkillGenerator({ assert }) {
  console.log('\nTesting skill-generator.js module exports...');

  (async () => {
    try {
      const module = await import('../../lib/generators/skill-generator.js');

      // Test exported functions
      assert(typeof module.generateSkillContent === 'function', 'generateSkillContent function is exported');
      assert(typeof module.generateSkillFromAnalysis === 'function', 'generateSkillFromAnalysis function is exported');
      assert(typeof module.generateSkillRecommendation === 'function', 'generateSkillRecommendation function is exported');
      assert(typeof module.formatSkillForDisplay === 'function', 'formatSkillForDisplay function is exported');
      assert(typeof module.generateInstallationPreview === 'function', 'generateInstallationPreview function is exported');

    } catch (error) {
      console.error('Error importing skill-generator module:', error.message);
      assert(false, 'Can import skill-generator module');
    }
  })();
}
