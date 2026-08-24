import crypto from 'node:crypto';
import express from 'express';
import { osStatus, processInput } from './src/os-core.js';
import { DOMINION_POLICY } from './src/dominion-moderation.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Every request receives a trace ID so moderation/governance actions can be audited
// without exposing secrets or private credentials.
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  next();
});

const ENGINE_VERSION = '2.6.0';

app.get('/', (req, res) => res.json({
  service: 'MercySoul OS',
  status: 'LIVE',
  version: ENGINE_VERSION,
  dominion: 'MercySoul Dominion Auto Metric',
  governance: 'MercySoul Dominion Constitution',
  rulerAccountability: true
}));

app.get('/health', (req, res) => res.status(200).json({
  ok: true,
  service: 'MercySoul OS',
  version: ENGINE_VERSION,
  dominion: true,
  governance: true
}));

app.get('/api/status', (req, res) => res.json({
  ...osStatus(),
  serverEngineVersion: ENGINE_VERSION
}));

app.get('/api/moderation/policy', (req, res) => res.json(DOMINION_POLICY));

app.get('/api/governance/constitution', (req, res) => res.json({
  name: 'MercySoul Dominion Constitution',
  status: 'active',
  effective: '2026-08-24',
  articles: [
    'Ruler is bound by the same rules as citizens',
    'Ruler errors require transparent correction',
    'Auto Metric moderation applies equally to the ruler',
    'Authority must align with Aṣẹ, Peace, and Truth'
  ],
  safeguards: [
    'No safety bypass',
    'No privacy bypass',
    'No security bypass',
    'No viewpoint suppression',
    'Human review remains available for ambiguous cases'
  ]
}));

app.post('/api/moderate', (req, res) => {
  try {
    const result = processInput({ ...req.body, type: req.body?.type || 'post' });
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Unable to moderate content' });
  }
});

app.post('/api/moderate/web', (req, res) => {
  try {
    const result = processInput({ ...req.body, type: 'web' });
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Unable to moderate web content' });
  }
});

// Governance evaluation deliberately uses the same moderation engine as every
// other source. There is no privileged moderation path for the ruler.
app.post('/api/governance/evaluate', (req, res) => {
  try {
    const actor = req.body?.actor || 'citizen';
    const result = processInput({
      ...req.body,
      type: req.body?.type === 'web' ? 'web' : 'post',
      source: `governance:${actor}`
    });

    res.status(200).json({
      ok: true,
      governance: 'MercySoul Dominion Constitution',
      equalTreatment: true,
      actor,
      ...result
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Unable to evaluate governance content' });
  }
});

app.post('/api/verify', async (req, res) => {
  res.json({
    success: true,
    governanceBound: true,
    text: 'MercySoul verification ready - test: ' + (req.body.prompt || '')
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`MercySoul OS LIVE on ${PORT} — engine ${ENGINE_VERSION}`));
