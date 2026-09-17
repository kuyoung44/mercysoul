import crypto from 'node:crypto';
import express from 'express';
import { createGuardianEvent } from './event-schema.js';
import { scoreGuardianEvent } from './risk-engine.js';

const router = express.Router();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GUARDIAN_API_KEY = process.env.GUARDIAN_API_KEY || '';
const MAX_EVENTS = 50;

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && GUARDIAN_API_KEY);
}

function authorized(req) {
  if (!GUARDIAN_API_KEY) return false;
  const header = String(req.get('authorization') || '');
  return header.startsWith('Bearer ') && crypto.timingSafeEqual(Buffer.from(header.slice(7)), Buffer.from(GUARDIAN_API_KEY));
}

function guard(req, res, next) {
  if (!configured()) return res.status(503).json({ ok: false, error: 'Guardian API is not configured' });
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  next();
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text.slice(0, 500) }; }
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${JSON.stringify(data).slice(0, 500)}`);
  return data;
}

router.get('/guardian/status', guard, async (_req, res) => {
  try {
    const agents = await supabase('guardian_agents?select=id&limit=1');
    res.json({ ok: true, connected: true, agentsTable: true, sampleAgentCount: agents.length });
  } catch (error) {
    res.status(502).json({ ok: false, connected: false, error: error.message });
  }
});

router.post('/guardian/enroll', guard, async (req, res) => {
  try {
    const ownerId = String(req.body?.ownerId || '').trim();
    const deviceName = String(req.body?.deviceName || '').trim();
    const platform = String(req.body?.platform || '').trim();
    const consentVersion = String(req.body?.consentVersion || 'guardian-1.0').trim();
    if (!ownerId || !deviceName || !platform) return res.status(400).json({ ok: false, error: 'ownerId, deviceName and platform are required' });
    const rows = await supabase('guardian_agents', {
      method: 'POST',
      body: JSON.stringify({ owner_id: ownerId, device_name: deviceName.slice(0, 200), platform: platform.slice(0, 100), consent_version: consentVersion.slice(0, 50), consented_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    });
    res.status(201).json({ ok: true, agent: rows?.[0] || null, consent: { required: true, recorded: true } });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

router.post('/guardian/events', guard, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.events) ? req.body.events.slice(0, MAX_EVENTS) : [req.body];
    if (!items.length) return res.status(400).json({ ok: false, error: 'At least one event is required' });
    const events = items.map((item) => createGuardianEvent({
      agentId: item.agentId,
      ownerId: item.ownerId,
      eventType: item.eventType,
      severity: item.severity,
      title: item.title,
      details: item.details
    })).map((event) => ({ ...event, occurred_at: event.occurredAt, agent_id: event.agentId, owner_id: event.ownerId, event_type: event.eventType }));
    const inserted = await supabase('guardian_events', { method: 'POST', body: JSON.stringify(events) });
    const alerts = inserted.filter((event) => scoreGuardianEvent(event) >= 50).map((event) => ({ event_id: event.id, owner_id: event.owner_id, risk_score: scoreGuardianEvent(event), status: 'open' }));
    if (alerts.length) await supabase('guardian_alerts', { method: 'POST', body: JSON.stringify(alerts) });
    res.status(201).json({ ok: true, accepted: inserted.length, alertsCreated: alerts.length });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get('/guardian/events', guard, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const ownerId = String(req.query.ownerId || '').trim();
    if (!ownerId) return res.status(400).json({ ok: false, error: 'ownerId is required' });
    const events = await supabase(`guardian_events?owner_id=eq.${encodeURIComponent(ownerId)}&select=id,agent_id,event_type,severity,title,details,occurred_at&order=occurred_at.desc&limit=${limit}`);
    res.json({ ok: true, events });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

router.get('/guardian/alerts', guard, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const ownerId = String(req.query.ownerId || '').trim();
    if (!ownerId) return res.status(400).json({ ok: false, error: 'ownerId is required' });
    const alerts = await supabase(`guardian_alerts?owner_id=eq.${encodeURIComponent(ownerId)}&select=id,event_id,risk_score,status,created_at,acknowledged_at,resolved_at&order=created_at.desc&limit=${limit}`);
    res.json({ ok: true, alerts });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

export default router;
