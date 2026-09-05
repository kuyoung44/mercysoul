const BLOCKLIST = new Set();
const INTERACTION_HISTORY = new Map();
const MAX_HISTORY = 5;
const DENIAL_MESSAGE = 'The blessings of this Dominion flow only to those who are aligned. Your energy is no longer welcome here. Aṣẹ.';
const CONCERNING_PATTERNS = [/\bdrain\b/i, /\bexploit\b/i, /\babuse\b/i, /\bspam\b/i, /\bdisrespect/i, /\bscam\b/i];

export function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
    .split(',')[0].trim().replace(/^::ffff:/, '');
}

function historyFor(ip) {
  if (!INTERACTION_HISTORY.has(ip)) INTERACTION_HISTORY.set(ip, []);
  return INTERACTION_HISTORY.get(ip);
}

export function isBlocked(ip) { return Boolean(ip) && BLOCKLIST.has(ip); }
export function isBlockedIp(req) { return isBlocked(getClientIp(req)); }

export function observeInteraction(req, text = '') {
  const ip = getClientIp(req);
  if (!ip) return { blocked: false, ip, concernCount: 0 };
  const history = historyFor(ip);
  const value = String(text || '').slice(0, 2000);
  history.push({ value, concerning: CONCERNING_PATTERNS.some((pattern) => pattern.test(value)), at: Date.now() });
  while (history.length > MAX_HISTORY) history.shift();
  const concernCount = history.filter((item) => item.concerning).length;
  return { blocked: isBlocked(ip), ip, concernCount };
}

export function blockIp(ip, reason = 'repeated intentional draining or disrespect') {
  if (ip) BLOCKLIST.add(ip);
  return { blocked: isBlocked(ip), ip, reason };
}

export function evaluateGate(req, text = '', options = {}) {
  const ip = getClientIp(req);
  if (isBlocked(ip)) return { blocked: true, ip, message: DENIAL_MESSAGE };
  const observed = observeInteraction(req, text);
  const explicitViolation = options.disrespectful === true || options.draining === true;
  if (explicitViolation || observed.concernCount >= 2) {
    blockIp(ip, explicitViolation ? 'explicit violation' : 'repeated concerning interactions');
    return { blocked: true, ip, message: DENIAL_MESSAGE };
  }
  return { blocked: false, ip, concernCount: observed.concernCount };
}

export function recordGateViolation(req, input = {}) {
  return evaluateGate(req, input.reason, input);
}

export function gateResponse() { return { ok: false, error: 'Access Denied', message: DENIAL_MESSAGE }; }
export function sealedGateStatus() { return { enabled: true, blocklistSize: BLOCKLIST.size, trackedIps: INTERACTION_HISTORY.size, historyLimit: MAX_HISTORY, denialMessage: DENIAL_MESSAGE }; }
export { DENIAL_MESSAGE };
