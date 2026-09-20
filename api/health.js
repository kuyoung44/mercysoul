import { config } from '../config.js';
import { healthRateLimit } from '../middleware/rateLimit.js';
import { requestLogging } from '../middleware/requestLogging.js';

export default function handler(req, res) {
  req.requestId = String(req.headers?.['x-request-id'] || Date.now());
  requestLogging(req, res, () => {});
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' });
  }
  return new Promise(resolve => {
    healthRateLimit(req, res, () => {
      res.status(200).json({
        success: true,
        data: {
          status: 'ok',
          uptime: process.uptime(),
          model: config.GEMINI_MODEL,
          memory: process.memoryUsage().rss,
        },
      });
      resolve();
    });
  });
}
