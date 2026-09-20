import crypto from 'node:crypto';

const REQUIRED = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'ALLOWED_ORIGINS', 'ADMIN_API_TOKEN'];

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) {
    console.error(`[MercySoul Config] Missing required environment variable: ${name}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = Object.freeze({
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  GEMINI_MODEL: required('GEMINI_MODEL'),
  ALLOWED_ORIGINS: required('ALLOWED_ORIGINS').split(',').map(v => v.trim()).filter(Boolean),
  ADMIN_API_TOKEN: required('ADMIN_API_TOKEN'),
  CHAT_RATE_LIMIT: 20,
  HEALTH_RATE_LIMIT: 100,
  RATE_WINDOW_MS: 60_000,
  CHAT_TIMEOUT_MS: 25_000,
  MAX_MESSAGE_LENGTH: 4000,
});

export function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 16);
}
