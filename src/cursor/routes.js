import express from 'express';
import { mercyCursorStatus, runMercyCursor } from './mercy-cursor.js';

const router = express.Router();

router.get('/cursor/status', (_req, res) => {
  res.json({ ok: true, cursor: mercyCursorStatus() });
});

router.post('/cursor/plan', async (req, res) => {
  try {
    const result = await runMercyCursor(req.body || {}, { requestId: req.requestId });
    res.status(result.alignment.approvalRequired ? 202 : 200).json(result);
  } catch (error) {
    res.status(400).json({ ok: false, requestId: req.requestId, error: error instanceof Error ? error.message : 'MercyCursor planning failed' });
  }
});

export default router;
