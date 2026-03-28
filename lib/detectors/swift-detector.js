import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export async function detectSwiftStack(cwd) {
  const podfilePath = path.join(cwd, 'Podfile');
  const xcodeproj = await glob('*.xcodeproj', { cwd, absolute: false });

  if (xcodeproj.length === 0 && !(await fs.pathExists(podfilePath))) {
    return { detected: false };
  }

  let framework = 'swiftui'; // Default to SwiftUI for modern iOS

  // Read Podfile to check for UIKit patterns
  if (await fs.pathExists(podfilePath)) {
    try {
      const podfile = await fs.readFile(podfilePath, 'utf-8');
      // If no SwiftUI mention, assume UIKit
      if (!podfile.toLowerCase().includes('swiftui')) {
        framework = 'uikit';
      }
    } catch (error) {
      console.error('Error reading Podfile:', error);
    }
  }

  return {
    detected: true,
    stack: 'swift-ios',
    confidence: xcodeproj.length > 0 ? 'high' : 'medium',
    language: 'swift',
    framework,
    testRunner: 'xctest',
    linter: 'swiftlint',
    formatter: null,
    buildTool: 'xcodebuild',
    evidence: {
      files: [podfilePath, ...xcodeproj],
    },
  };
}