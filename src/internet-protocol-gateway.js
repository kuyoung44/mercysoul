const DEFAULT_REFRESH_HOURS = 6;
const MAX_SOURCES = 20;
const MAX_PROTOCOLS = 100;
const sources = new Map();
const protocols = new Map();
let lastSyncAt = null;
let lastSyncError = null;
let syncInProgress = false;

const clean = (value, max = 500) => String(value ?? '').trim().slice(0, max);

function normalizeSource(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Protocol sources must use HTTPS');
  return parsed.toString();
}

function validateProtocol(item, sourceUrl) {
  if (!item || typeof item !== 'object') throw new Error('Protocol entry must be an object');
  const id = clean(item.id, 120);
  const version = clean(item.version, 60);
  const title = clean(item.title, 200);
  const rules = Array.isArray(item.rules) ? item.rules.map((r) => clean(r, 1000)).filter(Boolean).slice(0, 50) : [];
  if (!id || !version || !title || !rules.length) throw new Error('Protocol requires id, version, title and at least one rule');
  return Object.freeze({ id, version, title, rules, source: sourceUrl, fetchedAt: new Date().toISOString() });
}

function normalizePayload(payload, sourceUrl) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.protocols) ? payload.protocols : [payload];
  return list.slice(0, MAX_PROTOCOLS).map((item) => validateProtocol(item, sourceUrl));
}

export function registerProtocolSource(url) {
  const normalized = normalizeSource(url);
  if (sources.size >= MAX_SOURCES && !sources.has(normalized)) throw new Error('Protocol source limit reached');
  sources.set(normalized, { url: normalized, enabled: true, addedAt: new Date().toISOString() });
  return sources.get(normalized);
}

export function listProtocolSources() { return [...sources.values()].map((source) => ({ ...source })); }

export async function syncInternetProtocols({ urls = [], timeoutMs = 8000 } = {}) {
  if (syncInProgress) return { ok: false, skipped: true, reason: 'sync already in progress' };
  for (const url of urls) registerProtocolSource(url);
  syncInProgress = true;
  const results = [];
  try {
    for (const source of sources.values()) {
      if (!source.enabled) continue;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(source.url, { headers: { accept: 'application/json' }, signal: controller.signal });
        clearTimeout(timer);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();
        const validated = normalizePayload(payload, source.url);
        for (const protocol of validated) protocols.set(protocol.id, protocol);
        results.push({ source: source.url, ok: true, imported: validated.length });
      } catch (error) {
        results.push({ source: source.url, ok: false, error: clean(error?.message, 300) });
      }
    }
    lastSyncAt = new Date().toISOString();
    lastSyncError = results.some((r) => !r.ok) ? 'One or more sources failed' : null;
    return { ok: results.every((r) => r.ok), syncedAt: lastSyncAt, results, protocolCount: protocols.size };
  } finally { syncInProgress = false; }
}

export function protocolGatewayStatus() {
  return {
    ok: true,
    mode: 'approved-HTTPS-sources-only',
    automaticInternetAccess: true,
    arbitraryInternetControl: false,
    sourceCount: sources.size,
    protocolCount: protocols.size,
    lastSyncAt,
    lastSyncError,
    refreshHours: Number(process.env.PROTOCOL_REFRESH_HOURS) || DEFAULT_REFRESH_HOURS,
    oauth: { gmail: 'requires explicit Google OAuth consent', social: 'requires explicit platform OAuth/API consent' }
  };
}

export function listProtocols() { return [...protocols.values()].map((protocol) => ({ ...protocol })); }

export function startProtocolRefresh() {
  const hours = Math.max(Number(process.env.PROTOCOL_REFRESH_HOURS) || DEFAULT_REFRESH_HOURS, 1);
  if (process.env.PROTOCOL_SOURCE_URLS) {
    for (const url of process.env.PROTOCOL_SOURCE_URLS.split(',').map((v) => v.trim()).filter(Boolean)) {
      try { registerProtocolSource(url); } catch { /* invalid sources are ignored */ }
    }
    syncInternetProtocols().catch(() => {});
  }
  return setInterval(() => syncInternetProtocols().catch(() => {}), hours * 60 * 60 * 1000);
}
