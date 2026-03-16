import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { ROSETTA_DIR } from './constants.js';

/**
 * Loads configuration from .rosetta.json and active profile.
 * Merges local config with profile defaults from registry.
 */
export async function loadConfig() {
  const localConfig = path.join(process.cwd(), '.rosetta.json');
  let config = {};
  if (await fs.pathExists(localConfig)) {
    try {
      config = await fs.readJson(localConfig);
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not read .rosetta.json: ${err.message}`));
    }
  }

  const profileDir = path.join(os.homedir(), '.rosetta');
  const profileFile = path.join(profileDir, 'active-profile.json');
  if (await fs.pathExists(profileFile)) {
    const activeData = await fs.readJson(profileFile);
    config._activeProfile = activeData.active;

    const registryPath = path.join(profileDir, 'registry.json');
    if (await fs.pathExists(registryPath)) {
      const registry = await fs.readJson(registryPath);
      if (registry.profiles && registry.profiles[activeData.active]) {
        // Merge profile defaults into config
        config = { ...registry.profiles[activeData.active], ...config };
      }
    }
  }

  return config;
}

/**
 * Switch active profile.
 * Creates active-profile.json and loads profile-specific settings from registry.
 */
export async function useProfile(profileName) {
  const profileDir = path.join(os.homedir(), '.rosetta');
  const profileFile = path.join(profileDir, 'active-profile.json');
  await fs.ensureDir(profileDir);
  await fs.writeJson(profileFile, { active: profileName }, { spaces: 2 });

  // Load profile specific config if it exists in registry
  const registryPath = path.join(profileDir, 'registry.json');
  if (await fs.pathExists(registryPath)) {
    const registry = await fs.readJson(registryPath);
    if (registry.profiles && registry.profiles[profileName]) {
      console.log(chalk.blue(`Applying settings for profile: ${profileName}`));
      // In a real impl, we'd merge registry.profiles[profileName] into a global persistent config
    }
  }

  console.log(chalk.bold.green(`Switched to profile: ${profileName}`));
  console.log(chalk.gray(`Next time you run "scaffold", Rosetta will prefer ${profileName} defaults.`));
}

/**
 * Ensure the registry directory and default registry file exist.
 */
export async function ensureRegistry() {
  const fs = await import('fs-extra');
  await fs.default.ensureDir(ROSETTA_DIR);

  const { DEFAULT_REGISTRY, REGISTRY_PATH } = await import('./constants.js');
  if (!(await fs.default.pathExists(REGISTRY_PATH))) {
    await fs.default.writeJson(REGISTRY_PATH, DEFAULT_REGISTRY, { spaces: 2 });
  }
}

/**
 * Load the registry from disk.
 */
export async function loadRegistry() {
  await ensureRegistry();
  const { REGISTRY_PATH } = await import('./constants.js');
  const fs = await import('fs-extra');
  return await fs.default.readJson(REGISTRY_PATH);
}

/**
 * Search the registry for presets or skills by type and optional domain.
 */
export async function searchRegistry(type, domain) {
  const registry = await loadRegistry();
  const items = registry[type] || [];
  return items.filter(item => !domain || item.domain === domain);
}

/**
 * Find a specific item in the registry by type and name.
 */
export async function findRegistryItem(type, name) {
  const registry = await loadRegistry();
  const items = registry[type] || [];
  return items.find(item => item.name === name);
}
