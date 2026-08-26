const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const REQUIRE_DURABLE_PERSISTENCE = String(process.env.REQUIRE_DURABLE_PERSISTENCE || 'false').toLowerCase() === 'true';
const EVENTS_TABLE = process.env.SUPABASE_EVENTS_TABLE || 'mercysoul_events';

export function supabaseStatus() {
  const configured = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
  return {
    provider: 'supabase',
    configured,
    durablePersistenceRequired: REQUIRE_DURABLE_PERSISTENCE,
    eventsTable: EVENTS_TABLE,
    healthy: configured || !REQUIRE_DURABLE_PERSISTENCE
  };
}

function headers() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal'
  };
}

export async function persistEvent(event) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (REQUIRE_DURABLE_PERSISTENCE) throw new Error('Supabase durable persistence is required but not configured');
    return { persisted: false, reason: 'not-configured' };
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(EVENTS_TABLE)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      event_type: String(event?.eventType || 'system'),
      request_id: event?.requestId || null,
      payload: event?.payload || {},
      created_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => 'Supabase request failed');
    throw new Error(`Supabase persistence failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  return { persisted: true };
}

export function persistEventBestEffort(event) {
  return persistEvent(event).catch((error) => {
    console.error('[Supabase] persistence error:', error.message);
    return { persisted: false, error: error.message };
  });
}
