/**
 * MercySoul Link Protection gate.
 * Pure validation only: never fetches submitted URLs or mutates external systems.
 */
const DEFAULT_BLOCKED_PROTOCOLS = new Set(['javascript:', 'vbscript:', 'file:', 'ftp:']);
const DEFAULT_TRACKING_KEYS = /^(utm_.+|gclid|fbclid|msclkid|mc_cid|mc_eid)$/i;

function isPrivateIpv4(host) {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127);
}

function normalizeHost(host) {
  return String(host || '').toLowerCase().replace(/\.$/, '');
}

export function evaluateLink(input, options = {}) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return { decision: 'BLOCK', reason: 'empty_url' };
  if (raw.length > 4096) return { decision: 'BLOCK', reason: 'url_too_long' };

  let url;
  try {
    url = new URL(raw);
  } catch {
    return { decision: 'QUARANTINE', reason: 'invalid_or_relative_url' };
  }

  const protocol = url.protocol.toLowerCase();
  if (DEFAULT_BLOCKED_PROTOCOLS.has(protocol)) {
    return { decision: 'BLOCK', reason: 'unsafe_protocol' };
  }
  if (protocol !== 'https:' && protocol !== 'http:') {
    return { decision: 'BLOCK', reason: 'unsupported_protocol' };
  }
  if (url.username || url.password) {
    return { decision: 'QUARANTINE', reason: 'embedded_credentials' };
  }

  const host = normalizeHost(url.hostname);
  if (!host || host === 'localhost' || host.endsWith('.localhost') ||
      host.endsWith('.local') || host === '::1' || isPrivateIpv4(host)) {
    return { decision: 'BLOCK', reason: 'local_or_private_destination', host };
  }

  const denylist = new Set((options.denylist || []).map(normalizeHost));
  if (denylist.has(host)) return { decision: 'BLOCK', reason: 'denylisted_host', host };

  const allowlist = (options.allowlist || []).map(normalizeHost);
  const allowlisted = allowlist.some(domain => host === domain || host.endsWith('.' + domain));
  const trackingKeys = [...url.searchParams.keys()].filter(key => DEFAULT_TRACKING_KEYS.test(key));
  const isHttp = protocol === 'http:';

  if (options.requireAllowlist && !allowlisted) {
    return { decision: 'QUARANTINE', reason: 'host_not_allowlisted', host, trackingKeys };
  }
  if (isHttp || trackingKeys.length) {
    return {
      decision: 'REVIEW',
      reason: isHttp ? 'https_preferred' : 'tracking_parameters_present',
      host,
      trackingKeys,
    };
  }

  return { decision: 'ALLOW', reason: allowlisted ? 'approved_host' : 'no_known_local_risk', host };
}

export function inspectHtmlLinks(html, options = {}) {
  const source = String(html || '');
  const matches = [...source.matchAll(/\b(?:href|src|action)\s*=\s*(["'])(.*?)\1/gi)];
  const findings = [];
  for (const match of matches) {
    const value = match[2].trim();
    if (!value || value.startsWith('#') || value.startsWith('/') || value.startsWith('./') ||
        value.startsWith('../') || value.startsWith('mailto:') || value.startsWith('tel:')) continue;
    const result = evaluateLink(value, options);
    if (result.decision !== 'ALLOW') findings.push({ value: value.slice(0, 500), ...result });
  }
  return findings;
}
