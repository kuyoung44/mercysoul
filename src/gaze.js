import express from 'express';

const router = express.Router();
let currentGazeState = 'idle';
let updatedAt = new Date().toISOString();

const VALID_STATES = new Set(['idle', 'focus', 'locked']);
const MAX_GAZE_REQUESTS_PER_MINUTE = 30;
let windowStartedAt = Date.now();
let windowCount = 0;

function authorized(req) {
  const configuredKey = process.env.GAZE_API_KEY;
  if (!configuredKey) return false;
  const supplied = req.get('x-gaze-api-key');
  return supplied === configuredKey;
}

function rateLimited() {
  const now = Date.now();
  if (now - windowStartedAt >= 60_000) {
    windowStartedAt = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > MAX_GAZE_REQUESTS_PER_MINUTE;
}

router.post('/gaze/evaluate', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Gaze authentication required' });
  if (rateLimited()) return res.status(429).json({ ok: false, error: 'Gaze rate limit exceeded' });

  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  const state = VALID_STATES.has(gaze) ? gaze : 'idle';
  currentGazeState = state;
  updatedAt = new Date().toISOString();

  if (state === 'locked') return res.json({ status: 'ACTIVE', gaze: state, message: 'Eyes locked. Vision Brain is now listening. Aṣẹ.', autoRespond: true, processedAt: updatedAt });
  if (state === 'focus') return res.json({ status: 'LISTENING', gaze: state, message: 'User is looking. Awaiting command...', autoRespond: false, processedAt: updatedAt });
  return res.json({ status: 'IDLE', gaze: state, message: 'User is not looking. AI paused.', autoRespond: false, processedAt: updatedAt });
});

router.get('/gaze/state', (req, res) => {
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Gaze authentication required' });
  res.json({ state: currentGazeState, active: currentGazeState === 'locked', autoRespond: currentGazeState === 'locked', updatedAt });
});

export default router;
