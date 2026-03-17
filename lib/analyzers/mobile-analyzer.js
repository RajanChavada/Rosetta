import fs from 'fs-extra';
import path from 'path';

export async function analyzeMobile(projectPath) {
  const detected = {
    frameworks: [],
    platforms: [],
    buildTools: [],
    configFiles: []
  };

  // Check package.json for React Native/Expo
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['react-native'] || Object.keys(deps).some(k => k.startsWith('@react-native/'))) {
        detected.frameworks.push('react-native');
      }
      if (deps.expo) {
        detected.buildTools.push('expo');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check Flutter: pubspec.yaml with sdk: flutter
  const pubspecPath = path.join(projectPath, 'pubspec.yaml');
  if (await fs.pathExists(pubspecPath)) {
    try {
      const content = await fs.readFile(pubspecPath, 'utf8');
      if (/sdk:\s*flutter/.test(content)) {
        detected.frameworks.push('flutter');
      }
    } catch (e) {}
  }

  // iOS detection
  const iosIndicators = [
    path.join(projectPath, 'ios'),
    path.join(projectPath, '.xcodeproj'),
    path.join(projectPath, 'Podfile'),
    path.join(projectPath, 'Podfile.lock')
  ];
  for (const indicator of iosIndicators) {
    if (await fs.pathExists(indicator)) {
      detected.frameworks.push('ios');
      detected.platforms.push('ios');
      detected.buildTools.push('xcode');
      break;
    }
  }

  // Android detection
  const androidIndicators = [
    path.join(projectPath, 'android'),
    path.join(projectPath, 'build.gradle'),
    path.join(projectPath, 'app/build.gradle'),
    path.join(projectPath, 'AndroidManifest.xml')
  ];
  for (const indicator of androidIndicators) {
    if (await fs.pathExists(indicator)) {
      detected.frameworks.push('android');
      detected.platforms.push('android');
      break;
    }
  }

  // Deduplicate
  detected.frameworks = [...new Set(detected.frameworks)];
  detected.platforms = [...new Set(detected.platforms)];
  detected.buildTools = [...new Set(detected.buildTools)];

  return detected;
}
