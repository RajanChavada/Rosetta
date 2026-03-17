// Debug the regex pattern
const url = 'https://github.com/superpowers/tree/main/skills/writing-plans';

// Test the regex
const treeMatch = url.match(/https:\/\/github\.com\/([^\/]+\/[^\/]+)\/tree\/([^\/]+)\/(.+)?/);

console.log('URL:', url);
console.log('Match result:', treeMatch);
if (treeMatch) {
  console.log('repoPath:', treeMatch[1]);
  console.log('branch:', treeMatch[2]);
  console.log('subPath:', treeMatch[3]);
} else {
  console.log('No match found');
}

// Let's try a simpler test
const parts = url.split('/');
console.log('URL parts:', parts);

// Extract repo path
const repoPath = parts.slice(3, 5).join('/');
console.log('Repo path:', repoPath);

// Extract branch
const branch = parts[5];
console.log('Branch:', branch);

// Extract subpath
const subPath = parts.slice(6).join('/');
console.log('Subpath:', subPath);