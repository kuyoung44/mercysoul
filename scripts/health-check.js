import http from 'node:http';

const url = process.env.MERCYSOUL_HEALTH_URL || 'http://127.0.0.1:3000/health';
const request = http.get(url, { timeout: 5000 }, res => {
  let body = '';
  res.on('data', chunk => { body += chunk; });
  res.on('end', () => {
    let data;
    try { data = JSON.parse(body); } catch { console.error('Health endpoint returned invalid JSON'); process.exit(1); }
    const healthy = res.statusCode === 200 && data.ok === true;
    console.log(JSON.stringify({ url, statusCode: res.statusCode, healthy, data }, null, 2));
    process.exitCode = healthy ? 0 : 1;
  });
});
request.on('timeout', () => { request.destroy(new Error('Health check timed out')); });
request.on('error', error => { console.error(`Health check failed: ${error.message}`); process.exitCode = 1; });
