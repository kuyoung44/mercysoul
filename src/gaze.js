import express from 'express';

const router = express.Router();
let currentGazeState = 'idle';
let deviceFocus = false;
let deviceScreenState = 'off';
let serverGaze = false;
let updatedAt = new Date().toISOString();
let lastDeviceSignal = null;

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

// DEVICE GAZE MATCH — MacroDroid / Samsung Smart Stay sync.
// Screen On:  { focused: true }  -> deviceFocus=true
// Screen Off: { focused: false } -> deviceFocus=false
// Both states are accepted so the server never treats a stale Screen On signal as active.
router.post('/device/focus/sync', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const { focused } = req.body || {};
  if (typeof focused !== 'boolean') return res.status(400).json({ ok:false, error:'Invalid focus payload; expected { focused: true|false }' });

  deviceFocus = focused;
  deviceScreenState = focused ? 'on' : 'off';
  updatedAt = new Date().toISOString();
  lastDeviceSignal = focused ? 'SCREEN_ON' : 'SCREEN_OFF';

  return res.status(200).json({
    status: 'DEVICE SYNCED',
    protocol: 'Smart Stay Link',
    signal: lastDeviceSignal,
    screen: deviceScreenState,
    focused: deviceFocus,
    deviceFocus,
    serverGaze,
    matched: deviceFocus && serverGaze,
    message: focused ? 'Screen On: device focus received.' : 'Screen Off: device focus cleared.',
    updatedAt
  });
});

// Server Eye Lens signal: { gaze: "locked"|"focus"|"idle" }
router.post('/gaze/update', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  if (!VALID_STATES.has(gaze)) return res.status(400).json({ ok:false, error:'Invalid gaze state' });
  currentGazeState = gaze;
  serverGaze = gaze === 'locked';
  updatedAt = new Date().toISOString();
  res.json({ status:'GAZE STATE UPDATED', gaze, locked:serverGaze, deviceFocus, deviceScreenState, matched:deviceFocus && serverGaze, updatedAt });
});

// Overall Device Gaze Match: both independently reported signals must be active.
router.get('/gaze/match', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'Gaze authentication required' });
  const matched = deviceFocus && serverGaze;
  res.json({ protocol:'Device Gaze Match', deviceFocus, deviceScreenState, serverGaze, gazeState:currentGazeState, matched, updatedAt, lastDeviceSignal, message:matched?'Mind and machine are one. Aṣẹ.':'Waiting for total alignment.' });
});

router.post('/gaze/evaluate', (req, res) => {
  if (!authAndLimit(req, res)) return;
  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  const state = VALID_STATES.has(gaze) ? gaze : 'idle';
  currentGazeState = state; serverGaze = state === 'locked'; updatedAt = new Date().toISOString();
  if (state === 'locked') return res.json({ status:'ACTIVE', gaze:state, message:'Eyes locked. Vision Brain is now listening. Aṣẹ.', autoRespond:true, processedAt:updatedAt, deviceFocus, deviceScreenState, matched:deviceFocus && serverGaze });
  if (state === 'focus') return res.json({ status:'LISTENING', gaze:state, message:'User is looking. Awaiting command...', autoRespond:false, processedAt:updatedAt, deviceFocus, deviceScreenState, matched:false });
  return res.json({ status:'IDLE', gaze:state, message:'User is not looking. AI paused.', autoRespond:false, processedAt:updatedAt, deviceFocus, deviceScreenState, matched:false });
});

router.get('/gaze/state', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok:false, error:'Gaze authentication required' });
  res.json({ state:currentGazeState, active:serverGaze, deviceFocus, deviceScreenState, serverGaze, matched:deviceFocus && serverGaze, autoRespond:serverGaze, lastDeviceSignal, updatedAt });
});

export default router;
