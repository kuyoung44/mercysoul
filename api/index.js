import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPersonalBot, personalBotStatus } from '../src/agent/personal-bot.js';

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

  // Keep the Personal assistant independent from the large MercySoul OS bootstrap.
  // This prevents unrelated server imports from taking down the public chat endpoint.
  if (requestPath === '/api/personal/status') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(JSON.stringify({ ok: true, personal: personalBotStatus() }));
  }

  if (requestPath === '/api/personal/chat') {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'POST');
      return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    }
    try {
      let body = req.body;
      if (!body) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString('utf8');
        body = raw ? JSON.parse(raw) : {};
      }
      const result = await runPersonalBot(body || {});
      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(JSON.stringify(result));
    } catch (error) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Personal chatbot failed' }));
    }
  }

  const app = await getApp();
  return app(req, res);
}
