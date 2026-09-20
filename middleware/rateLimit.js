import { config, hashIp } from '../config.js';

const buckets = new Map();

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
}

function limiter(max) {
  return (req, res, next) => {
    const key = hashIp(getIp(req));
    const now = Date.now();
    const bucket = (buckets.get(key) || []).filter(t => t > now - config.RATE_WINDOW_MS);
    bucket.push(now);
    buckets.set(key, bucket);
    if (bucket.length > max) {
      return res.status(429).json({ success: false, error: 'Too many requests.', code: 'RATE_LIMITED' });
    }
    next();
  };
}

export const chatRateLimit = limiter(config.CHAT_RATE_LIMIT);
export const healthRateLimit = limiter(config.HEALTH_RATE_LIMIT);
