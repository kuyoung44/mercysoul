import express from 'express';

const router = express.Router();
let currentGazeState = 'idle';
let updatedAt = new Date().toISOString();

const VALID_STATES = new Set(['idle', 'focus', 'locked']);

router.post('/gaze/evaluate', (req, res) => {
  const gaze = String(req.body?.gaze ?? '').toLowerCase();
  const state = VALID_STATES.has(gaze) ? gaze : 'idle';

  currentGazeState = state;
  updatedAt = new Date().toISOString();

  if (state === 'locked') {
    return res.json({
      status: 'ACTIVE',
      gaze: state,
      message: 'Eyes locked. Vision Brain is now listening. Aṣẹ.',
      autoRespond: true,
      processedAt: updatedAt
    });
  }

  if (state === 'focus') {
    return res.json({
      status: 'LISTENING',
      gaze: state,
      message: 'User is looking. Awaiting command...',
      autoRespond: false,
      processedAt: updatedAt
    });
  }

  return res.json({
    status: 'IDLE',
    gaze: state,
    message: 'User is not looking. AI paused.',
    autoRespond: false,
    processedAt: updatedAt
  });
});

router.get('/gaze/state', (_req, res) => {
  res.json({
    state: currentGazeState,
    active: currentGazeState === 'locked',
    autoRespond: currentGazeState === 'locked',
    updatedAt
  });
});

export default router;
