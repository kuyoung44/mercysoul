import fs from 'node:fs';
import process from 'node:process';

const report = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  cwd: process.cwd(),
  checks: [],
  status: 'unknown'
};

function check(name, fn) {
  try { fn(); report.checks.push({ name, status: 'pass' }); }
  catch (error) { report.checks.push({ name, status: 'fail', error: error.message }); }
}

check('package.json', () => JSON.parse(fs.readFileSync('package.json', 'utf8')));
check('server.js', () => fs.accessSync('server.js'));
check('src modules', () => {
  for (const file of ['verification.js','store.js','vision-brain.js','alignment.js','creation-engine.js','creation-pipeline.js','artwork-store.js','image-provider.js']) fs.accessSync(`src/${file}`);
});

report.status = report.checks.every(c => c.status === 'pass') ? 'pass' : 'fail';
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/diagnostic.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.status === 'fail') process.exitCode = 1;
