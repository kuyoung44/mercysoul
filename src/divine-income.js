import crypto from 'node:crypto';
import { supabaseStatus } from './supabase.js';

const TALISMAN_EVENT_TYPE = 'talisman_order';
const CONFIRMATION_MESSAGE = 'Aṣẹ. Your vision has been received. The King will contact you shortly.';
const clients = [];

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function supabaseRestUrl(path) {
  const base = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  return `${base}/rest/v1/${path}`;
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json'
  };
}

function rememberClient(client) {
  clients.unshift(client);
  return client;
}

export function isClientListAuthorized(authorization) {
  const configuredToken = String(process.env.DIVINE_INCOME_ADMIN_TOKEN || '');
  if (!configuredToken) return true;
  return String(authorization || '') === `Bearer ${configuredToken}`;
}

export async function createTalismanOrder({ name, email, vision, requestId } = {}) {
  const client = {
    id: crypto.randomUUID(),
    name: clean(name, 120),
    email: clean(email, 254).toLowerCase(),
    vision: clean(vision, 5000),
    source: '/api/magnetic/talisman',
    createdAt: new Date().toISOString(),
    requestId: requestId || null
  };

  if (!client.name || !client.email || !client.vision) {
    return { ok: false, status: 400, error: 'name, email, and vision are required' };
  }

  if (!validEmail(client.email)) {
    return { ok: false, status: 400, error: 'A valid email address is required' };
  }

  rememberClient(client);

  let persistence = { persisted: false, provider: 'memory' };
  const db = supabaseStatus();
  if (db.configured) {
    try {
      const response = await fetch(supabaseRestUrl(encodeURIComponent(process.env.SUPABASE_EVENTS_TABLE || 'mercysoul_events')), {
        method: 'POST',
        headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          event_type: TALISMAN_EVENT_TYPE,
          request_id: client.requestId,
          payload: client,
          created_at: client.createdAt
        })
      });

      if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
      persistence = { persisted: true, provider: 'supabase' };
    } catch (error) {
      console.error('[Divine Income] Supabase persistence error:', error.message);
      persistence = { persisted: false, provider: 'supabase', error: error.message };
    }
  }

  return {
    ok: true,
    status: 201,
    message: CONFIRMATION_MESSAGE,
    orderId: client.id,
    source: client.source,
    persistence
  };
}

export async function listTalismanClients() {
  const db = supabaseStatus();
  if (db.configured) {
    try {
      const table = encodeURIComponent(process.env.SUPABASE_EVENTS_TABLE || 'mercysoul_events');
      const query = `${table}?event_type=eq.${encodeURIComponent(TALISMAN_EVENT_TYPE)}&select=payload,created_at&order=created_at.desc`;
      const response = await fetch(supabaseRestUrl(query), { headers: supabaseHeaders() });
      if (!response.ok) throw new Error(`Supabase request failed (${response.status})`);
      const rows = await response.json();
      return {
        ok: true,
        source: 'supabase',
        count: rows.length,
        clients: rows.map((row) => row.payload).filter(Boolean)
      };
    } catch (error) {
      console.error('[Divine Income] Supabase client-list error:', error.message);
    }
  }

  return {
    ok: true,
    source: 'memory',
    count: clients.length,
    clients: clients.map((client) => ({ ...client }))
  };
}

export function divineIncomeStatus() {
  const db = supabaseStatus();
  return {
    protocol: 'DIVINE INCOME',
    version: '1.1.0',
    orderEndpoint: '/api/order/talisman',
    clientListEndpoint: '/api/order/clients',
    talismanEndpoint: '/api/magnetic/talisman',
    inMemoryClients: clients.length,
    persistence: db.configured ? 'supabase' : 'memory',
    clientListAuth: Boolean(process.env.DIVINE_INCOME_ADMIN_TOKEN)
  };
}
