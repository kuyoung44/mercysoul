import crypto from 'node:crypto';
import app from './server.js';
import { runMercySoulAgent, mercysoulGraphStatus } from './src/agent/mercysoul-graph.js';
import { runDeepResearch, deepResearchStatus } from './src/deep-research.js';
import { runMercySoulBot, mercysoulBotStatus } from './src/agent/mercysoul-bot.js';
import { runPersonalBot, personalBotStatus } from './src/agent/personal-bot.js';
import { whatsappStatus, handleWhatsAppWebhook } from './src/whatsapp-cloud.js';
import { facebookMessengerStatus, handleFacebookWebhook } from './src/facebook-messenger.js';
import commandCenterRouter from './src/command-center/routes.js';
import cursorRouter from './src/cursor/routes.js';
import { initializeAiFraudPersistence } from './src/ai-fraud-rule.js';
import { mercySoulAiStatus, runMercySoulAI } from './src/ai/mercy-soul-ai.js';

app.use('/api', commandCenterRouter);
app.use('/api', cursorRouter);

app.get('/api/bot/status', (_req, res) => res.json({ ok: true, bot: mercysoulBotStatus(), whatsapp: whatsappStatus() }));
app.get('/api/ai/status', (_req, res) => res.json({ ok: true, ai: mercySoulAiStatus() }));
app.post('/api/ai/chat', async (req, res) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  try {
    const result = await runMercySoulAI(req.body || {}, { requestId });
    res.status(result.ok ? 200 : 422).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, requestId, decision: 'review', error: error instanceof Error ? error.message : 'MercySoul AI failed' });
  }
});
app.get('/api/personal/status', (_req, res) => res.json({ ok: true, personal: personalBotStatus() }));
app.post('/api/personal/chat', async (req, res) => { try { const result = await runPersonalBot(req.body || {}); res.status(result.ok ? 200 : 400).json(result); } catch (error) { res.status(502).json({ ok: false, error: error instanceof Error ? error.message : 'Personal chatbot failed' }); } });

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

app.get('/personal', (_req, res) => res.sendFile(new URL('./public/personal.html', import.meta.url).pathname));

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
app.get('/api/wa-webhook', handleWhatsAppWebhook);
app.post('/api/wa-webhook', handleWhatsAppWebhook);

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    const fraudPersistence = await initializeAiFraudPersistence();
    console.log('[MercySoul] AI-fraud persistence initialized:', fraudPersistence);
  } catch (error) {
    console.error('[MercySoul] AI-fraud persistence initialization failed:', error.message);
    if (String(process.env.REQUIRE_DURABLE_PERSISTENCE || '').toLowerCase() === 'true') process.exit(1);
  }
  app.listen(PORT, () => console.log(`MercySoul OS listening on ${PORT}`));
}

bootstrap();
