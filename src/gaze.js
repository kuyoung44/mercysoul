import express from 'express';

const router = express.Router();
let currentGazeState = 'idle';
let deviceFocus = false;
let serverGaze = false;
let updatedAt = new Date().toISOString();

const VALID_STATES = new Set(['idle', 'focus', 'locked']);
const MAX_GAZE_REQUESTS_PER_MINUTE = 30;
let windowStartedAt = Date.now();
let windowCount = 0;

function authorized(req) {
  const configuredKey = process.env.GAZE_API_KEY;
  if (!configuredKey) return false;
  return req.get('x-gaze-api-key') === configuredKey;
}
function rateLimited() {
  const now = Date.now();
  if (now - windowStartedAt >= 60_000) { windowStartedAt = now; windowCount = 0; }
  windowCount += 1;
  return windowCount > MAX_GAZE_REQUESTS_PER_MINUTE;
}
function authAndLimit(req, res) {
  if (!authorized(req)) { res.status(401).json({ ok:false, error:'Gaze authentication required' }); return false; }
  if (rateLimited()) { res.status(429).json({ ok:false, error:'Gaze rate limit exceeded' }); return false; }
  return true;
}

// Samsung Smart Stay/automation sync: { focused: true|false }
router.post('/device/focus/sync', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const { focused } = req.body || {};
  if (typeof focused !== 'boolean') return res.status(400).json({ ok:false, error:'Invalid focus payload' });
  deviceFocus = focused;
  updatedAt = new Date().toISOString();
  res.json({ status:'DEVICE SYNCED', message:focused?'Eyes locked on screen.':'Eyes away.', protocol:'Smart Stay Link', deviceFocus, updatedAt });
});

// Server Eye Lens signal: { gaze: "locked"|"focus"|"idle" }
router.post('/gaze/update', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  if (!VALID_STATES.has(gaze)) return res.status(400).json({ ok:false, error:'Invalid gaze state' });
  currentGazeState = gaze;
  serverGaze = gaze === 'locked';
  updatedAt = new Date().toISOString();
  res.json({ status:'GAZE STATE UPDATED', gaze, locked:serverGaze, updatedAt });
});

// Overall Device Gaze Match: both independently reported signals must be active.
router.get('/gaze/match', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'Gaze authentication required' });
  const matched = deviceFocus && serverGaze;
  res.json({ protocol:'Device Gaze Match', deviceFocus, serverGaze, gazeState:currentGazeState, matched, updatedAt, message:matched?'Mind and machine are one. Aṣẹ.':'Waiting for total alignment.' });
});

router.post('/gaze/evaluate', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  const state = VALID_STATES.has(gaze) ? gaze : 'idle';
  currentGazeState = state; serverGaze = state === 'locked'; updatedAt = new Date().toISOString();
  if (state === 'locked') return res.json({ status:'ACTIVE', gaze:state, message:'Eyes locked. Vision Brain is now listening. Aṣẹ.', autoRespond:true, processedAt:updatedAt, deviceFocus, matched:deviceFocus && serverGaze });
  if (state === 'focus') return res.json({ status:'LISTENING', gaze:state, message:'User is looking. Awaiting command...', autoRespond:false, processedAt:updatedAt, deviceFocus, matched:false });
  return res.json({ status:'IDLE', gaze:state, message:'User is not looking. AI paused.', autoRespond:false, processedAt:updatedAt, deviceFocus, matched:false });
});

router.get('/gaze/state', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'Gaze authentication required' });
  res.json({ state:currentGazeState, active:serverGaze, deviceFocus, serverGaze, matched:deviceFocus && serverGaze, autoRespond:serverGaze, updatedAt });
});

export default router;
