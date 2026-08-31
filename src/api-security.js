import crypto from 'node:crypto';

const WINDOW_MS = Number(process.env.CHAT_RATE_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.CHAT_RATE_MAX_REQUESTS || 10);
const BURST_MS = Number(process.env.CHAT_BURST_WINDOW_MS || 10_000);
const MAX_BURST = Number(process.env.CHAT_BURST_MAX_REQUESTS || 3);
const VIOLATION_LIMIT = Number(process.env.CHAT_VIOLATION_LIMIT || 3);
const BLOCK_MS = Number(process.env.CHAT_BLOCK_MS || 15 * 60_000);
const MAX_MESSAGE_LENGTH = Number(process.env.CHAT_MAX_MESSAGE_LENGTH || 4000);

const buckets = new Map();
const violations = new Map();
const blocked = new Map();

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

function now() {
  return Date.now();
}

function getIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function securityLog(event, meta) {
  console.warn('[MercySoul Security]', JSON.stringify({
    event,
    at: new Date().toISOString(),
    ...meta,
  }));
}

function cleanup(key, time) {
  const bucket = buckets.get(key);
  if (bucket) {
    bucket.requests = bucket.requests.filter((timestamp) => timestamp > time - WINDOW_MS);
    bucket.bursts = bucket.bursts.filter((timestamp) => timestamp > time - BURST_MS);
    if (!bucket.requests.length) buckets.delete(key);
  }
  const violation = violations.get(key);
  if (violation && violation.resetAt <= time) violations.delete(key);
  const blockedUntil = blocked.get(key);
  if (blockedUntil && blockedUntil <= time) blocked.delete(key);
}

export function getClientSecurityContext(req) {
  const ip = getIp(req);
  const ipHash = hash(ip);
  const requestId = String(req.headers?.['x-request-id'] || crypto.randomUUID()).slice(0, 128);
  return { ipHash, requestId, userAgent: String(req.headers?.['user-agent'] || '').slice(0, 160) };
}

export function validateChatRequest(req) {
  const { ipHash, requestId, userAgent } = getClientSecurityContext(req);
  const time = now();
  cleanup(ipHash, time);

  const blockedUntil = blocked.get(ipHash);
  if (blockedUntil && blockedUntil > time) {
    securityLog('blocked_request', { ipHash, requestId, reason: 'temporary_block' });
    return { allowed: false, status: 429, retryAfter: Math.ceil((blockedUntil - time) / 1000), ipHash, requestId };
  }

  const bucket = buckets.get(ipHash) || { requests: [], bursts: [] };
  bucket.requests.push(time);
  bucket.bursts.push(time);
  buckets.set(ipHash, bucket);

  const suspiciousUserAgent = /(^$|curl|wget|python-requests|python\/|scrapy|aiohttp|httpclient|headlesschrome|phantomjs|selenium)/i.test(userAgent);
  const overWindow = bucket.requests.length > MAX_REQUESTS;
  const overBurst = bucket.bursts.length > MAX_BURST;
  const suspicious = suspiciousUserAgent || overBurst;

  if (overWindow || suspicious) {
    const current = violations.get(ipHash) || { count: 0, resetAt: time + BLOCK_MS };
    current.count += 1;
    current.resetAt = time + BLOCK_MS;
    violations.set(ipHash, current);

    if (current.count >= VIOLATION_LIMIT) {
      const blockedUntilValue = time + BLOCK_MS;
      blocked.set(ipHash, blockedUntilValue);
      securityLog('temporary_block', { ipHash, requestId, reason: overWindow ? 'rate_limit' : 'automation_signal' });
      return { allowed: false, status: 429, retryAfter: Math.ceil(BLOCK_MS / 1000), ipHash, requestId };
    }

    securityLog('request_rejected', { ipHash, requestId, reason: overWindow ? 'rate_limit' : 'automation_signal' });
    return { allowed: false, status: 429, retryAfter: 10, ipHash, requestId };
  }

  return { allowed: true, ipHash, requestId };
}

export function validateOrigin(req) {
  const origin = String(req.headers?.origin || '').trim();
  if (!origin) return true;
  const configured = String(process.env.ALLOWED_ORIGINS || 'https://mercysoul.vercel.app').split(',').map((value) => value.trim()).filter(Boolean);
  return configured.includes(origin);
}

export function validateMessage(message) {
  return typeof message === 'string' && message.trim().length > 0 && message.trim().length <= MAX_MESSAGE_LENGTH;
}

export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');
}
