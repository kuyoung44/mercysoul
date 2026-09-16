import crypto from 'node:crypto';
import app from './server.js';
import { runMercySoulAgent, mercysoulGraphStatus } from './src/agent/mercysoul-graph.js';
import { facebookMessengerStatus, handleFacebookWebhook } from './src/facebook-messenger.js';

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

app.get('/api/fb/status', (_req, res) => res.json({ ok: true, facebook: facebookMessengerStatus() }));
app.get('/api/fb-webhook', handleFacebookWebhook);
app.post('/api/fb-webhook', handleFacebookWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MercySoul OS listening on ${PORT}`));
