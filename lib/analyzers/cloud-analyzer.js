import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeCloud(projectPath) {
  const detected = {
    providers: [],
    services: [],
    configFiles: [],
    orchestration: []
  };

  // Docker
  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  if (await fs.pathExists(dockerfilePath)) {
    detected.configFiles.push('Dockerfile');
    detected.providers.push('docker');
  }

  const composePath = path.join(projectPath, 'docker-compose.yml');
  if (await fs.pathExists(composePath)) {
    detected.configFiles.push('docker-compose.yml');
    detected.providers.push('docker');
  }

  const dockerignorePath = path.join(projectPath, '.dockerignore');
  if (await fs.pathExists(dockerignorePath)) {
    detected.configFiles.push('.dockerignore');
  }

  // Kubernetes
  const k8sDir = path.join(projectPath, 'k8s');
  const helmDir = path.join(projectPath, 'helm');
  if (await fs.pathExists(k8sDir) || await fs.pathExists(helmDir)) {
    detected.orchestration.push('kubernetes');
  }

  // Check YAML files for apiVersion
  const yamlFiles = await recursiveGlob(projectPath, '**/*.yaml');
  for (const file of yamlFiles.slice(0, 10)) { // Limit to avoid performance issues
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('apiVersion:')) {
        detected.orchestration.push('kubernetes');
        break;
      }
    } catch (e) {}
  }

  // Terraform
  const tfFiles = await recursiveGlob(projectPath, '**/*.tf');
  if (tfFiles.length > 0) {
    detected.configFiles.push(...tfFiles.slice(0, 5)); // limit to 5
    detected.providers.push('terraform');
  }

  // Serverless Framework
  const serverlessYml = path.join(projectPath, 'serverless.yml');
  const serverlessYaml = path.join(projectPath, 'serverless.yaml');
  if (await fs.pathExists(serverlessYml) || await fs.pathExists(serverlessYaml)) {
    detected.configFiles.push('serverless.yml');
    detected.providers.push('serverless');
  }

  // Package.json → cloud SDKs
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['aws-sdk'] || Object.keys(deps).some(k => k.startsWith('@aws-sdk/'))) {
        detected.providers.push('aws');
        detected.services.push('s3', 'lambda', 'ec2', 'dynamodb');
      }
      if (deps['@google-cloud/*'] || deps.firebase) {
        detected.providers.push('gcp');
      }
      if (Object.keys(deps).some(k => k.startsWith('@azure/'))) {
        detected.providers.push('azure');
      }
    } catch (e) {}
  }

  // Go modules
  const goModPath = path.join(projectPath, 'go.mod');
  if (await fs.pathExists(goModPath)) {
    try {
      const content = await fs.readFile(goModPath, 'utf8');
      if (content.includes('github.com/aws/aws-sdk-go')) {
        detected.providers.push('aws');
      }
      if (content.includes('cloud.google.com/go')) {
        detected.providers.push('gcp');
      }
    } catch (e) {}
  }

  // Python requirements
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (await fs.pathExists(reqPath)) {
    try {
      const content = await fs.readFile(reqPath, 'utf8');
      const lines = content.toLowerCase().split('\n');
      if (lines.some(l => l.includes('boto3') || l.includes('aws-'))) {
        detected.providers.push('aws');
      }
      if (lines.some(l => l.includes('google-cloud'))) {
        detected.providers.push('gcp');
      }
    } catch (e) {}
  }

  // Deduplicate
  detected.providers = [...new Set(detected.providers)];
  detected.services = [...new Set(detected.services)];
  detected.configFiles = [...new Set(detected.configFiles)];
  detected.orchestration = [...new Set(detected.orchestration)];

  return detected;
}
