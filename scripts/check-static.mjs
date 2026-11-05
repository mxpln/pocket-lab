import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(entries.map(async entry => {
    const full = path.join(dir, entry.name);
    assert(!entry.isSymbolicLink(), `Unexpected symlink: ${full}`);
    assert(!['.git', '.openai', 'node_modules', 'hosting.json'].includes(entry.name), `Unexpected deployment metadata: ${full}`);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return groups.flat();
}

const files = await walk(root);
assert(files.includes(path.join(root, 'index.html')), 'dist/index.html is missing');
let references = 0;
for (const file of files) {
  const ext = path.extname(file);
  if (!['.js', '.css', '.html'].includes(ext)) continue;
  const source = await readFile(file, 'utf8');
  if (ext === '.js') {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  const pattern = ext === '.html'
    ? /(?:src|href)=["']([^"']+)["']/g
    : ext === '.css'
      ? /url\(["']?([^\)"']+)["']?\)/g
      : /(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) {
    const ref = match[1];
    if (!ref || ref.startsWith('#') || /^(https?:|data:)/.test(ref)) continue;
    assert(!ref.startsWith('/'), `Root-absolute asset breaks project Pages URLs: ${ref}`);
    const target = path.resolve(path.dirname(file), ref.split(/[?#]/)[0]);
    const relative = path.relative(root, target);
    assert(!relative.startsWith('..') && !path.isAbsolute(relative), `Asset escapes dist: ${ref}`);
    await stat(target);
    references++;
  }
}
const fonts = await readFile(path.join(root, 'fonts.css'), 'utf8');
assert(!fonts.includes('https://'), 'Fonts must be bundled locally');
for (const name of ['dmsans-OFL.txt', 'spacegrotesk-OFL.txt']) {
  await stat(path.join(root, 'assets', 'fonts', name));
}
console.log(`Verified ${files.length} static files, ${references} relative references, JavaScript syntax and local font licenses.`);
