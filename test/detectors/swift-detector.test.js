import { detectSwiftStack } from '../../lib/detectors/swift-detector.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';

describe('Swift Detector', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'test-temp-swift');
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should detect swift-ios stack with SwiftUI from Podfile', async () => {
    const podfilePath = path.join(testDir, 'Podfile');
    await fs.writeFile(podfilePath, `
# Podfile for iOS app
platform :ios, '13.0'
target 'MyApp' do
  use_frameworks!
  pod 'SwiftUI'
  pod 'Combine'
end
`);

    const result = await detectSwiftStack(testDir);

    expect(result.detected).toBe(true);
    expect(result.stack).toBe('swift-ios');
    expect(result.framework).toBe('swiftui');
    expect(result.language).toBe('swift');
    expect(result.testRunner).toBe('xctest');
    expect(result.linter).toBe('swiftlint');
    expect(result.buildTool).toBe('xcodebuild');
    expect(result.evidence.files).toContain(podfilePath);
  });

  it('should detect swift-ios stack with UIKit from Podfile', async () => {
    const podfilePath = path.join(testDir, 'Podfile');
    await fs.writeFile(podfilePath, `
# Podfile for iOS app
platform :ios, '13.0'
target 'MyApp' do
  use_frameworks!
  pod 'UIKit'
  pod 'Foundation'
end
`);

    const result = await detectSwiftStack(testDir);

    expect(result.detected).toBe(true);
    expect(result.stack).toBe('swift-ios');
    expect(result.framework).toBe('uikit');
    expect(result.language).toBe('swift');
    expect(result.confidence).toBe('medium');
  });

  it('should detect swift-ios stack from Xcode project files', async () => {
    // Create a minimal Xcode project structure
    const xcodeProjDir = path.join(testDir, 'MyApp.xcodeproj');
    await fs.ensureDir(xcodeProjDir);

    const result = await detectSwiftStack(testDir);

    expect(result.detected).toBe(true);
    expect(result.stack).toBe('swift-ios');
    expect(result.framework).toBe('swiftui'); // Default
    expect(result.confidence).toBe('high');
    expect(result.evidence.files).toContain('MyApp.xcodeproj');
  });

  it('should not detect swift stack without iOS project files', async () => {
    const result = await detectSwiftStack(testDir);

    expect(result.detected).toBe(false);
  });
});