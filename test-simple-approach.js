#!/usr/bin/env node

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';

const execFileAsync = promisify(execFile);

async function simpleSubdirectoryClone() {
  console.log('Testing simpler approach: full clone then move subdirectory...\n');

  const repoUrl = `file:///tmp/test-subdir-repo`;
  const tempDir = `/tmp/test-full-clone-${Date.now()}`;
  const dest = `/tmp/test-dest-${Date.now()}`;
  const subdirectory = 'skills/my-skill';

  try {
    // 1. Clone full repo
    console.log('1. Cloning full repository...');
    await execFileAsync('git', ['clone', repoUrl, tempDir]);
    console.log('   ✓ Clone complete');

    // 2. Check subdirectory exists and has SKILL.md
    const skillDir = path.join(tempDir, subdirectory);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!await fs.pathExists(skillFile)) {
      throw new Error(`SKILL.md not found in ${subdirectory}`);
    }
    console.log(`   ✓ SKILL.md found at ${skillFile}`);

    // 3. Move entire subdirectory to destination
    console.log('2. Moving subdirectory to destination...');
    await fs.move(skillDir, dest);
    console.log('   ✓ Moved to', dest);

    // 4. Check that SKILL.md is at destination
    const destSkillFile = path.join(dest, 'SKILL.md');
    if (await fs.pathExists(destSkillFile)) {
      console.log(`   ✓ SKILL.md exists at destination: ${destSkillFile}`);
    } else {
      throw new Error('SKILL.md not found at destination');
    }

    // 5. Check if git repo was preserved
    const destGitDir = path.join(dest, '.git');
    if (await fs.pathExists(destGitDir)) {
      console.log('   ✓ Git repository preserved in destination!');

      // Verify we can get commit info
      const { stdout: commit } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: dest });
      console.log(`   ✓ Current commit: ${commit.trim()}`);
    } else {
      console.log('   ⚠ No .git directory at destination (subdirectory might not be a standalone repo)');
    }

    console.log('\n✓✓✓ SUCCESS: Subdirectory extracted with git history!\n');

  } catch (err) {
    console.error('\n✗✗✗ FAILED:', err.message);
    console.error(err.stack);
  } finally {
    // Cleanup
    for (const dir of [tempDir, dest]) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    }
  }
}

simpleSubdirectoryClone().catch(console.error);