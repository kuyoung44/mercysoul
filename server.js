import express from 'express';
import { osStatus, processInput } from './src/os-core.js';
import { DOMINION_POLICY } from './src/dominion-moderation.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => res.json({
  service: 'MercySoul OS',
  status: 'LIVE',
  version: '2.5.0',
  dominion: 'MercySoul Dominion Auto Metric'
}));

app.get('/api/status', (req, res) => res.json(osStatus()));
app.get('/api/moderation/policy', (req, res) => res.json(DOMINION_POLICY));

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

app.post('/api/verify', async (req, res) => {
  res.json({ success: true, text: 'MercySoul verification ready - test: ' + (req.body.prompt || '') });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`MercySoul OS LIVE on ${PORT}`));
