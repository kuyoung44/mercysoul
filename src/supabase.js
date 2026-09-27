const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const REQUIRE_DURABLE_PERSISTENCE = String(process.env.REQUIRE_DURABLE_PERSISTENCE || 'false').toLowerCase() === 'true';
const EVENTS_TABLE = process.env.SUPABASE_EVENTS_TABLE || 'mercysoul_events';
const AI_FRAUD_TABLE = process.env.SUPABASE_AI_FRAUD_TABLE || 'mercysoul_ai_fraud_reviews';

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

function headers(prefer = 'return=minimal') {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer
  };
}

export async function persistAiFraudReview(review) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (REQUIRE_DURABLE_PERSISTENCE) throw new Error('Supabase durable persistence is required but not configured');
    return { persisted: false, reason: 'not-configured' };
  }
  const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(AI_FRAUD_TABLE)}?on_conflict=review_id`;
  const response = await fetch(url, {
    method: 'POST',
    headers: headers('resolution=merge-duplicates,return=minimal'),
    body: JSON.stringify({
      review_id: review.reviewId,
      account_id: review.accountId || null,
      status: review.status,
      decision: review.decision,
      evidence: review.evidence || {},
      created_at: review.createdAt,
      reviewed_at: review.reviewedAt || null,
      reviewed_by: review.reviewedBy || null,
      blocked_at: review.blockedAt || null
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => 'Supabase AI-fraud persistence failed');
    throw new Error(`Supabase AI-fraud persistence failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return { persisted: true };
}

export async function updateAiFraudDecision(reviewId, decision) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (REQUIRE_DURABLE_PERSISTENCE) throw new Error('Supabase durable persistence is required but not configured');
    return { persisted: false, reason: 'not-configured' };
  }
  const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(AI_FRAUD_TABLE)}?review_id=eq.${encodeURIComponent(reviewId)}`;
  const response = await fetch(url, { method: 'PATCH', headers: headers('return=minimal'), body: JSON.stringify(decision) });
  if (!response.ok) {
    const detail = await response.text().catch(() => 'Supabase AI-fraud decision update failed');
    throw new Error(`Supabase AI-fraud decision update failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return { persisted: true };
}

export async function loadAiFraudState() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (REQUIRE_DURABLE_PERSISTENCE) throw new Error('Supabase durable persistence is required but not configured');
    return { persisted: false, reviews: [] };
  }
  const url = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(AI_FRAUD_TABLE)}?decision=in.%28pending%2Cconfirmed%29&select=review_id,account_id,status,decision,evidence,created_at,reviewed_at,reviewed_by,blocked_at&order=created_at.asc&limit=5000`;
  const response = await fetch(url, { method: 'GET', headers: headers('return=representation') });
  if (!response.ok) {
    const detail = await response.text().catch(() => 'Supabase AI-fraud state load failed');
    throw new Error(`Supabase AI-fraud state load failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return { persisted: true, reviews: await response.json() };
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
