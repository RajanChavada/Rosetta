// Test the updated regex pattern
const url = 'https://github.com/superpowers/tree/main/skills/writing-plans';

// Test the regex
const treeMatch = url.match(/https:\/\/github\.com\/([^\/]+(?:\/[^\/]+)*)\/tree\/([^\/]+)\/(.+)?/);

console.log('URL:', url);
console.log('Match result:', treeMatch);
if (treeMatch) {
  console.log('repoPath:', treeMatch[1]);
  console.log('branch:', treeMatch[2]);
  console.log('subPath:', treeMatch[3]);
  console.log('repoUrl:', `https://github.com/${treeMatch[1]}`);
} else {
  console.log('No match found');
}