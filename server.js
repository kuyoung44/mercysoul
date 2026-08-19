import express from 'express';
import crypto from 'node:crypto';
import { verifyVision, verifyOrder, paymentApproval } from './src/verification.js';
import { storeMode, saveVision, saveOrder, listOrders, logEvent } from './src/store.js';
import { buildCreativeBrief } from './src/vision-brain.js';
import { runCreationPipeline } from './src/creation-pipeline.js';
import { evaluateAlignment, AUTONOMY } from './src/alignment.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
const orders = new Map();
const visions = new Map();
const events = [];

async function log(type, data, entityId = null) {
  const event = { id: crypto.randomUUID(), type, data, at: new Date().toISOString() };
  events.push(event);
  await logEvent(type, entityId, data);
}

function moderateCreationInput(vision, order) {
  const raw = `${vision?.rawIdea || ''} ${vision?.brief?.direction || ''}`.toLowerCase();
  const disallowed = ['child sexual', 'sexual exploitation', 'non-consensual sexual', 'rape', 'sexual violence'];
  const matched = disallowed.find(term => raw.includes(term));
  if (matched) return { approved: false, reason: 'Request requires rejection or human safety review', matchedTerm: matched };
  if (!vision?.brief?.direction || order?.status !== 'paid') return { approved: false, reason: 'Missing verified brief or paid order' };
  return { approved: true };
}

async function startCreation(order) {
  const vision = visions.get(order.visionId);
  if (!vision) return { status: 'awaiting_vision' };
  const moderation = moderateCreationInput(vision, order);
  if (!moderation.approved) {
    await log('creation_moderated', { orderId: order.id, ...moderation }, order.id);
    return { status: 'moderation_required', moderation };
  }
  const alignment = evaluateAlignment('generate_art', { authorized: true, customerIntent: true });
  if (alignment.decision !== AUTONOMY.AUTO) return { status: 'awaiting_confirmation', alignment };
  const result = await runCreationPipeline(vision, order);
  order.artwork = result;
  await log('creation_started', { orderId: order.id, artworkId: result.id, status: result.status }, order.id);
  return result;
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'MercySoul OS', version: '1.5.1', verification: 'enabled', moderation: 'enabled', persistence: storeMode(), visionBrain: 'enabled', creationEngine: 'enabled', alignment: 'enabled' }));

app.post('/api/visions', async (req, res) => {
  const check = verifyVision(req.body);
  if (!check.approved) return res.status(422).json({ approved: false, errors: check.errors });
  const id = `VIS-${crypto.randomUUID()}`;
  const vision = { id, ...req.body, brief: buildCreativeBrief(req.body.rawIdea), status: 'verified', approval: 'automatic', createdAt: new Date().toISOString() };
  const saved = await saveVision(vision);
  if (saved.error) return res.status(500).json({ approved: false, error: 'Vision persistence failed' });
  visions.set(id, vision);
  await log('vision_verified', { id }, id);
  res.status(201).json({ ...vision, persistence: storeMode() });
});

app.get('/api/visions/:id/brief', (req, res) => {
  const vision = visions.get(req.params.id);
  if (!vision) return res.status(404).json({ error: 'Vision not found' });
  res.json({ visionId: vision.id, brief: vision.brief });
});

app.post('/api/orders', async (req, res) => {
  const check = verifyOrder(req.body);
  if (!check.approved) return res.status(422).json({ approved: false, errors: check.errors });
  if (!visions.has(req.body.visionId)) return res.status(404).json({ approved: false, error: 'Vision not found' });
  const id = `ORD-${crypto.randomUUID()}`;
  const order = { id, ...req.body, status: 'pending_payment', approval: 'automatic', createdAt: new Date().toISOString() };
  const saved = await saveOrder(order);
  if (saved.error) return res.status(500).json({ approved: false, error: 'Order persistence failed' });
  orders.set(id, order);
  await log('order_verified', { id }, id);
  res.status(201).json({ ...order, persistence: storeMode() });
});

app.get('/api/orders', async (_req, res) => {
  const remote = await listOrders();
  if (!remote.error && remote.data) return res.json(remote.data);
  res.json([...orders.values()]);
});
app.get('/api/visions', (_req, res) => res.json([...visions.values()]));
app.get('/api/events', (_req, res) => res.json(events.slice(-100)));

app.post('/api/orders/:id/create', async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'paid') return res.status(409).json({ error: 'Order must be paid before creation' });
  try {
    const result = await startCreation(order);
    res.status(202).json({ orderId: order.id, ...result });
  } catch (error) {
    await log('creation_failed', { orderId: order.id, error: error.message }, order.id);
    res.status(500).json({ error: 'Creation pipeline failed' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (process.env.PAYSTACK_SECRET_KEY) {
    const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== expected) return res.status(401).json({ error: 'Invalid signature' });
  }
  const data = req.body?.data || {};
  if (!paymentApproval(data)) return res.sendStatus(200);
  for (const order of orders.values()) {
    if (order.reference === data.reference || order.id === data.metadata?.orderId) {
      order.status = 'paid';
      order.payment = { reference: data.reference, status: data.status, verifiedAt: new Date().toISOString() };
      await log('payment_verified', { orderId: order.id, reference: data.reference }, order.id);
      try { await startCreation(order); } catch (error) { await log('creation_failed', { orderId: order.id, error: error.message }, order.id); }
    }
  }
  res.sendStatus(200);
});

app.get('/', (_req, res) => res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>MercySoul OS</title><style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:20px}textarea,button{width:100%;padding:12px;margin:7px 0;box-sizing:border-box}button{cursor:pointer}.card{padding:16px;border:1px solid #ddd;border-radius:12px;margin-top:16px}</style></head><body><h1>MercySoul OS</h1><p>You describe it. MercySoul structures it.</p><textarea id="vision" rows="7" placeholder="Describe what you imagine..."></textarea><button onclick="capture()">Verify & Build Creative Brief</button><div id="out"></div><script>async function capture(){const vision=document.getElementById('vision').value;const r=await fetch('/api/visions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawIdea:vision})});const d=await r.json();document.getElementById('out').innerHTML='<div class="card"><pre>'+JSON.stringify(d,null,2)+'</pre></div>'}</script></body></html>`));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MercySoul OS 1.5.1 listening on ${port} | persistence=${storeMode()}`));
