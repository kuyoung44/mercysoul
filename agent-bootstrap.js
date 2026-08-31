import crypto from 'node:crypto';
import app from './server.js';
import { runMercySoulAgent, mercysoulGraphStatus } from './src/agent/mercysoul-graph.js';

app.get('/api/agent/status', (_req, res) => {
  res.json({ ok: true, service: 'MercySoul Agent', ...mercysoulGraphStatus() });
});

app.post('/api/agent/run', async (req, res) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  try {
    const result = await runMercySoulAgent(req.body || {}, { requestId });
    res.status(result.ok ? 200 : 422).json({ ok: result.ok, requestId, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, requestId, error: error instanceof Error ? error.message : 'Agent execution failed' });
  }
});
