import { hashIp } from '../config.js';

export function requestLogging(req, res, next) {
  const started = process.hrtime.bigint();
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
  const ipHash = hashIp(ip);
  const timestamp = new Date().toISOString();
  res.on('finish', () => {
    const responseTimeMs = Number(process.hrtime.bigint() - started) / 1e6;
    console.log('[MercySoul Request]', JSON.stringify({
      method: req.method,
      path: req.originalUrl || req.url,
      ipHash,
      timestamp,
      responseTimeMs: Number(responseTimeMs.toFixed(2)),
      status: res.statusCode,
      requestId: req.requestId,
    }));
  });
  next();
}
