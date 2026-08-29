const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TABLE = 'global_map_events';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const rateBuckets = new Map();

function validCoordinate(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

function bucketCoordinate(value) {
  // ~11 km grid cells. Exact visitor coordinates are never persisted.
  return Math.round(Number(value) * 10) / 10;
}

function clientKey(req) {
  // Only an in-memory rate-limit key; never persisted.
  return req.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown';
}

function rateAllowed(req) {
  const now = Date.now();
  const key = clientKey(req);
  const current = rateBuckets.get(key) || { started: now, count: 0 };
  if (now - current.started >= RATE_WINDOW_MS) {
    current.started = now;
    current.count = 0;
  }
  current.count += 1;
  rateBuckets.set(key, current);
  if (rateBuckets.size > 5000) {
    for (const [k, v] of rateBuckets) if (now - v.started >= RATE_WINDOW_MS) rateBuckets.delete(k);
  }
  return current.count <= RATE_LIMIT;
}

function supabaseHeaders(prefer = 'return=minimal') {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer
  };
}

async function reverseGeocode(lat, lon) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('zoom', '3');
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MercySoul-Global-Map/1.0 (privacy-preserving country aggregation)'
    },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`Reverse geocoding failed (${response.status})`);
  const data = await response.json();
  const code = String(data?.address?.country_code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new Error('Unable to determine country');
  return code;
}

async function insertEvent({ countryCode, latBucket, lonBucket }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase persistence is not configured');
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({
      country_code: countryCode,
      latitude_bucket: latBucket,
      longitude_bucket: lonBucket
    })
  });
  if (!response.ok) throw new Error(`Supabase map persistence failed (${response.status})`);
}

async function mapStats() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase persistence is not configured');
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=country_code&order=created_at.desc&limit=5000`,
    { headers: supabaseHeaders('return=representation') }
  );
  if (!response.ok) throw new Error(`Supabase map read failed (${response.status})`);
  const rows = await response.json();
  const countries = [...new Set(rows.map((row) => row.country_code).filter((code) => /^[A-Z]{2}$/.test(code)))].sort();
  return { countries, countryCount: countries.length, eventCount: rows.length, updatedAt: new Date().toISOString() };
}

export async function locateHandler(req, res) {
  if (!rateAllowed(req)) return res.status(429).json({ ok: false, error: 'Rate limit exceeded. Try again later.' });
  const lat = Number(req.body?.lat);
  const lon = Number(req.body?.lon ?? req.body?.long);
  if (!validCoordinate(lat, -90, 90) || !validCoordinate(lon, -180, 180)) {
    return res.status(400).json({ ok: false, error: 'Valid latitude and longitude are required.' });
  }
  try {
    // Country resolution happens only against the coarse 0.1° cell, never the exact coordinate.
    const latBucket = bucketCoordinate(lat);
    const lonBucket = bucketCoordinate(lon);
    const countryCode = await reverseGeocode(latBucket, lonBucket);
    await insertEvent({ countryCode, latBucket, lonBucket });
    return res.status(201).json({
      ok: true,
      countryCode,
      privacy: 'Only a coarse location bucket is stored; exact coordinates are discarded.',
      stored: true
    });
  } catch (error) {
    return res.status(503).json({ ok: false, error: 'Unable to record map visit safely.' });
  }
}

export async function mapStatsHandler(_req, res) {
  try {
    const stats = await mapStats();
    return res.json({ ok: true, ...stats, privacy: 'Country-level display only. Stored coordinates are coarse buckets and are never returned.' });
  } catch {
    return res.status(503).json({ ok: false, error: 'Global Map is temporarily unavailable.' });
  }
}
