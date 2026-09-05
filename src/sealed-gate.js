const BLOCKLIST = new Set();
const DENIAL_MESSAGE = 'The blessings of this Dominion flow only to those who are aligned. Your energy is no longer welcome here. Aṣẹ.';
const INTENTIONAL_DRAIN_PATTERNS = [/\bdrain\b/i, /\bexploit\b/i, /\babuse\b/i, /\bspam\b/i, /\bdisrespect/i, /\bscam\b/i];
export function getClientIp(req) { return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim().replace(/^::ffff:/, ''); }
export function isBlocked(ip) { return BLOCKLIST.has(ip); }
export function isBlockedIp(req) { return isBlocked(getClientIp(req)); }
export function blockIp(ip, reason = 'intentional draining or disrespect') { if (ip) BLOCKLIST.add(ip); return { blocked: BLOCKLIST.has(ip), ip, reason }; }
export function evaluateGate(req, text = '') { const ip = getClientIp(req); if (isBlocked(ip)) return { blocked: true, ip, message: DENIAL_MESSAGE }; if (INTENTIONAL_DRAIN_PATTERNS.some((pattern) => pattern.test(String(text)))) { blockIp(ip); return { blocked: true, ip, message: DENIAL_MESSAGE }; } return { blocked: false, ip }; }
export function recordGateViolation(req, input = {}) { const text = [input.reason, input.disrespectful ? 'disrespectful' : '', input.draining ? 'draining' : ''].filter(Boolean).join(' '); return evaluateGate(req, text); }
export function gateResponse() { return { ok: false, error: 'Access Denied', message: DENIAL_MESSAGE }; }
export function sealedGateStatus() { return { enabled: true, blocklistSize: BLOCKLIST.size, denialMessage: DENIAL_MESSAGE }; }
export { DENIAL_MESSAGE };
