import crypto from 'node:crypto';
import app from './server.js';
import { runMercySoulAgent, mercysoulGraphStatus } from './src/agent/mercysoul-graph.js';
import { runDeepResearch, deepResearchStatus } from './src/deep-research.js';
import { facebookMessengerStatus, handleFacebookWebhook } from './src/facebook-messenger.js';

app.get('/api/bot/status', (_req, res) => res.json({ ok: true, bot: mercysoulBotStatus() }));

async function mercySoulBotHandler(req, res) {
  try {
    const result = await runMercySoulBot(req.body || {});
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(502).json({ ok: false, error: error instanceof Error ? error.message : 'MercySoul Bot failed' });
  }
}

app.post('/api/bot/chat', mercySoulBotHandler);
app.post('/api/chat', mercySoulBotHandler);

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

app.get('/api/research/status', (_req, res) => res.json({ ok: true, research: deepResearchStatus() }));
app.post('/api/research', async (req, res) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  try {
    const result = await runDeepResearch({
      query: req.body?.query,
      context: req.body?.context,
      mode: req.body?.mode || 'deep',
    });
    res.status(200).json({ ...result, requestId });
  } catch (error) {
    res.status(400).json({ ok: false, requestId, error: error instanceof Error ? error.message : 'Research failed' });
  }
});

app.get('/api/fb/status', (_req, res) => res.json({ ok: true, facebook: facebookMessengerStatus() }));
app.get('/api/fb-webhook', handleFacebookWebhook);
app.post('/api/fb-webhook', handleFacebookWebhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MercySoul OS listening on ${PORT}`));
