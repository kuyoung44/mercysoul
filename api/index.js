import fs from 'node:fs/promises';
import { createHmac, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPersonalBot, personalBotStatus } from '../src/agent/personal-bot.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOMEPAGE = path.join(ROOT, 'public', 'index.html');
const FOUNDER_PAGE = path.join(ROOT, 'founder.html');
const FOUNDER_COOKIE = 'ms_founder_session';
const founderLoginAttempts = new Map();

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}
function founderSecret() { const value = String(process.env.FOUNDER_DASHBOARD_PASSWORD || '').trim(); return value.length >= 16 ? value : ''; }
function founderSignature(expires) {
  return createHmac('sha256', founderSecret()).update(`mercysoul-founder:${expires}`).digest('hex');
}
function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    if (index < 0) return [part, ''];
    try { return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]; } catch { return [part.slice(0, index), '']; }
  }));
}
function founderSessionValid(req) {
  if (!founderSecret()) return false;
  const value = parseCookies(req.headers?.cookie || '')[FOUNDER_COOKIE] || '';
  const [expiresText, signature] = value.split('.');
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Date.now() || expires > Date.now() + 31 * 60 * 1000 || !signature) return false;
  return safeEqual(signature, founderSignature(expires));
}
function founderCookie(req, res, value, maxAge) {
  const secure = req.headers?.['x-forwarded-proto'] === 'https' || !/^localhost(?::|$)/.test(String(req.headers?.host || ''));
  res.setHeader('Set-Cookie', `${FOUNDER_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure ? '; Secure' : ''}`);
}
async function readRequestJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw new Error('Request too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}
function sameOrigin(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = String(req.headers?.host || '').toLowerCase();
    return parsed.host.toLowerCase() === host;
  } catch { return false; }
}
let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import('../server.js').then((module) => module.default);
  }
  return appPromise;
}

export default async function handler(req, res) {
  const requestPath = String(req.url || '').split('?')[0];

  if (requestPath === '/founder' || requestPath === '/founder/') {
    const html = await fs.readFile(FOUNDER_PAGE, 'utf8');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    return res.end(html);
  }

  if (requestPath === '/api/founder/session') {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET') {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, authenticated: founderSessionValid(req) }));
    }
    if (req.method === 'DELETE') {
      if (!sameOrigin(req)) { res.statusCode = 403; return res.end(JSON.stringify({ ok: false, error: 'Origin rejected' })); }
      founderCookie(req, res, '', 0);
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: true, authenticated: false }));
    }
    if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('Allow', 'GET, POST, DELETE'); return res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' })); }
    if (!sameOrigin(req)) { res.statusCode = 403; return res.end(JSON.stringify({ ok: false, error: 'Origin rejected' })); }
    const ip = String(req.headers?.['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const now = Date.now();
    const attempts = founderLoginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    if (attempts.resetAt <= now) { attempts.count = 0; attempts.resetAt = now + 15 * 60 * 1000; }
    if (attempts.count >= 8) { res.statusCode = 429; return res.end(JSON.stringify({ ok: false, error: 'Too many attempts. Try again later.' })); }
    let body;
    try { body = await readRequestJson(req); } catch { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, error: 'Invalid request' })); }
    const secret = founderSecret();
    if (!secret || !safeEqual(body?.passphrase, secret)) {
      attempts.count += 1; founderLoginAttempts.set(ip, attempts);
      res.statusCode = secret ? 401 : 503;
      return res.end(JSON.stringify({ ok: false, error: secret ? 'Access code not accepted' : 'Founder access is not configured on this deployment' }));
    }
    founderLoginAttempts.delete(ip);
    const expires = now + 30 * 60 * 1000;
    founderCookie(req, res, `${expires}.${founderSignature(expires)}`, 1800);
    res.statusCode = 200;
    return res.end(JSON.stringify({ ok: true, authenticated: true, expiresAt: new Date(expires).toISOString() }));
  }

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
