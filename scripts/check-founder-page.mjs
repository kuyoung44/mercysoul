import fs from 'node:fs/promises';
import vm from 'node:vm';

const html = await fs.readFile(new URL('../founder.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (scripts.length !== 1) {
  throw new Error(`Expected exactly one inline founder dashboard script; found ${scripts.length}`);
}
new vm.Script(scripts[0], { filename: 'founder.html:inline-script' });
console.log('Founder dashboard inline JavaScript syntax: OK');
