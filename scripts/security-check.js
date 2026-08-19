import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const result = { generatedAt: new Date().toISOString(), checks: [], status: 'pass' };
function run(name, command, args) {
  try { execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8' }); result.checks.push({ name, status: 'pass' }); }
  catch (error) { result.status = 'fail'; result.checks.push({ name, status: 'fail', output: `${error.stdout || ''}${error.stderr || ''}`.slice(-4000) }); }
}

run('npm audit', 'npm', ['audit', '--audit-level=high']);
const secrets = /(?:sk_live_|sk_test_|PAYSTACK_SECRET_KEY\s*=\s*[^$\s]|service_role\s*=\s*[^$\s])/i;
for (const file of ['server.js', 'SECURITY.md']) {
  if (fs.existsSync(file) && secrets.test(fs.readFileSync(file, 'utf8'))) {
    result.status = 'fail';
    result.checks.push({ name: `secret scan: ${file}`, status: 'fail' });
  }
}
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/security-report.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (result.status === 'fail') process.exitCode = 1;
