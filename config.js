import crypto from 'node:crypto';

// Optional integrations must not prevent the core API from starting.
// Each route reports a clear unavailable state when its provider credentials are absent.
const env = (name, fallback = '') => String(process.env[name] || fallback).trim();
const allowedOrigins = env(
  'ALLOWED_ORIGINS',
  'https://mercysoul.vercel.app,https://mercysoul-git-build-vision-brain-ai-app-2026-11-22-mercy-soul.vercel.app'
).split(',').map(v => v.trim()).filter(Boolean);

export const config = Object.freeze({
  GEMINI_API_KEY: env('GEMINI_API_KEY'),
  GEMINI_MODEL: env('GEMINI_MODEL', 'gemini-2.5-flash'),
  ALLOWED_ORIGINS: allowedOrigins,
  ADMIN_API_TOKEN: env('ADMIN_API_TOKEN'),
  OPENAI_API_KEY: env('OPENAI_API_KEY'),
  VISION_BRAIN_OPENAI_MODEL: env('VISION_BRAIN_OPENAI_MODEL', 'gpt-6.2-sol'),
  CHAT_RATE_LIMIT: 20,
  HEALTH_RATE_LIMIT: 100,
  RATE_WINDOW_MS: 60_000,
  CHAT_TIMEOUT_MS: 25_000,
  MAX_MESSAGE_LENGTH: 4000,
});

export function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 16);
}
