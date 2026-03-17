#!/usr/bin/env node

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

async function testSparseCheckout() {
  console.log('Testing sparse checkout manually...\n');

  const repoUrl = `file:///tmp/test-subdir-repo`;
  const dest = `/tmp/test-skill-dest-${Date.now()}`;
  const subdirectory = 'skills/my-skill';

  console.log(`Repo: ${repoUrl}`);
  console.log(`Dest: ${dest}`);
  console.log(`Subdirectory: ${subdirectory}\n`);

  try {
    // Create dest directory
    await fs.ensureDir(dest);

    // Clone with --no-checkout and --separate-git-dir
    const tempGitDir = path.join(dest, '.git');
    console.log('1. Cloning with --no-checkout...');
    await execFileAsync('git', ['clone', '--no-checkout', '--separate-git-dir', tempGitDir, repoUrl, dest]);
    console.log('   ✓ Clone complete');

    // Configure sparse checkout
    console.log('2. Configuring sparse checkout...');
    await execFileAsync('git', ['config', '--file', path.join(tempGitDir, 'config'), 'core.sparseCheckout', 'true']);

    // Create sparse-checkout file
    const sparseCheckoutFile = path.join(tempGitDir, 'info', 'sparse-checkout');
    await fs.ensureDir(path.dirname(sparseCheckoutFile));
    await fs.writeFile(sparseCheckoutFile, subdirectory + '\n');
    console.log('   ✓ Sparse checkout configured');

    // Checkout
    console.log('3. Checking out...');
    await execFileAsync('git', ['--git-dir', tempGitDir, '--work-tree', dest, 'checkout', 'HEAD']);
    console.log('   ✓ Checkout complete');

    // Check what's in dest
    console.log('4. Checking destination contents...');
    const items = await fs.readdir(dest);
    console.log(`   Contents: ${items.join(', ')}`);

    // Find SKILL.md
    const skillDir = path.join(dest, subdirectory);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (await fs.pathExists(skillFile)) {
      console.log(`   ✓ SKILL.md found at: ${skillFile}`);

      // Move contents
      console.log('5. Moving subdirectory contents to destination root...');
      const skillContents = await fs.readdir(skillDir);
      console.log(`   Skill contents: ${skillContents.join(', ')}`);

      for (const item of skillContents) {
        const src = path.join(skillDir, item);
        const dst = path.join(dest, item);
        await fs.move(src, dst);
      }

      // Remove empty skill directory
      await fs.remove(skillDir);
      console.log('   ✓ Moved contents, removed empty subdirectory');

      // Check final contents
      const finalItems = await fs.readdir(dest);
      console.log(`   Final contents: ${finalItems.join(', ')}`);

      if (await fs.pathExists(path.join(dest, 'SKILL.md'))) {
        console.log('\n✓✓✓ SUCCESS: SKILL.md is now at destination root!');
      }
    } else {
      console.log(`   ✗ SKILL.md not found at expected path: ${skillFile}`);
      console.log('   This may indicate sparse checkout did not work as expected');
    }

  } catch (err) {
    console.error('\n✗✗✗ FAILED:', err.message);
    console.error(err.stack);
  } finally {
    // Cleanup
    if (await fs.pathExists(dest)) {
      await fs.remove(dest);
    }
  }
}

testSparseCheckout().catch(console.error);