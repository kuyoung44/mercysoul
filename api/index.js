import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOMEPAGE = path.join(ROOT, 'public', 'index.html');
let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../server.js').then((module) => module.default);
  }
  return appPromise;
}

export default async function handler(req, res) {
  const requestPath = String(req.url || '').split('?')[0];

  // Keep the public homepage independent from the strict backend bootstrap.
  // This prevents a missing private API secret from taking down the public site.
  if (requestPath === '/' || requestPath === '') {
    const html = await fs.readFile(HOMEPAGE, 'utf8');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.end(html);
  }

  const app = await getApp();
  return app(req, res);
}
