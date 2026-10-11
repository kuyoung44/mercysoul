import express from 'express';
import { evaluateLink } from './link-protection.js';

const router = express.Router();

function listFromEnv(name) {
  return String(process.env[name] || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
}

router.get('/governance/link-protection/status', (_req, res) => {
  res.json({
    ok: true,
    policy: 'MercySoul Link Protection v1.0',
    enforcement: 'evaluation-api',
    active: true,
    automaticPageBlocking: false,
    note: 'This endpoint evaluates submitted URLs only. It does not scan every rendered page or fetch destinations.',
  });
});

router.post('/governance/link-protection/evaluate', (req, res) => {
  const url = req.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ ok: false, error: 'A URL string is required.' });
  }
  const result = evaluateLink(url, {
    allowlist: listFromEnv('MERCYSOUL_LINK_ALLOWLIST'),
    denylist: listFromEnv('MERCYSOUL_LINK_DENYLIST'),
    requireAllowlist: String(process.env.MERCYSOUL_LINK_REQUIRE_ALLOWLIST || '').toLowerCase() === 'true',
  });
  return res.status(result.decision === 'BLOCK' ? 403 : 200).json({
    ok: result.decision === 'ALLOW',
    policy: 'MercySoul Link Protection v1.0',
    ...result,
  });
});

export default router;
