// Joins game/ into one page: docs/index.html. Usage: node build.mjs   (OUT=dir to write somewhere else, EXTRA=a.js,b.js adds test scripts)
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const g = (p) => fs.readFileSync(path.join(root, 'game', p), 'utf8');
const src = fs.readdirSync(path.join(root, 'game/src')).filter((f) => f.endsWith('.js')).sort();
let js = src.map((f) => `// ---- ${f}\n` + g('src/' + f)).join('\n');
for (const e of String(process.env.EXTRA || '').split(',').filter(Boolean)) js += `\n// ---- extra ${e}\n` + fs.readFileSync(e, 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const html = g('head.html').replace('/*CSS*/', g('style.css')) + g('body.html') + `<script>\n'use strict';\nconst VERSION = '${version}';\n${js}\n</script>\n</body>\n</html>\n`;

// house rule: no em dashes anywhere in the page
const bad = html.indexOf('—');
if (bad >= 0) {
  const line = html.slice(0, bad).split('\n').length;
  console.error(`Build stopped: an em dash at line ${line}: ` + html.split('\n')[line - 1].trim().slice(0, 120));
  process.exit(1);
}
const out = process.env.OUT || path.join(root, 'docs');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log(`built ${path.join(out, 'index.html')}: ${(html.length / 1024).toFixed(0)} KB, ${src.length} source files, v${version}`);
