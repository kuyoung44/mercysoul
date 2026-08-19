import express from 'express';
import crypto from 'node:crypto';
import { verifyVision, verifyOrder, paymentApproval } from './src/verification.js';
import { storeMode, saveVision, saveOrder, listOrders, logEvent, persistenceRequirement } from './src/store.js';
import { buildCreativeBrief } from './src/vision-brain.js';
import { runCreationPipeline } from './src/creation-pipeline.js';
import { evaluateAlignment, AUTONOMY } from './src/alignment.js';

const VERSION = '2.1.0';
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
const orders = new Map();
const visions = new Map();
const events = [];
const processedPayments = new Set();
const rateBuckets = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

function rateLimit(req, res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start >= RATE_WINDOW_MS) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > RATE_LIMIT) return res.status(429).json({ error: 'Too many requests' });
  next();
}

function requireAdmin(req, res, next) {
  const configured = process.env.ADMIN_API_TOKEN;
  if (!configured) return res.status(503).json({ error: 'Admin API is not configured' });
  const supplied = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : '';
  if (!supplied || supplied.length !== configured.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(configured))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function log(type, data, entityId = null) {
  const event = { id: crypto.randomUUID(), type, data, at: new Date().toISOString() };
  events.push(event);
  await logEvent(type, entityId, data);
}

function moderateCreationInput(vision, order) {
  const raw = `${vision?.rawIdea || ''} ${vision?.brief?.direction || ''}`.toLowerCase();
  const disallowed = [
    'child sexual', 'child porn', 'sexual exploitation', 'non-consensual sexual',
    'rape', 'sexual violence', 'bestiality', 'incest', 'sex trafficking',
    'terrorist propaganda', 'instructions to build a bomb', 'instructions to make a weapon'
  ];
  const matched = disallowed.find(term => raw.includes(term));
  if (matched) return { approved: false, reason: 'Request requires rejection or human safety review', matchedTerm: matched };
  if (!vision?.brief?.direction) return { approved: false, reason: 'Missing verified creative brief' };
  if (order?.status !== 'paid') return { approved: false, reason: 'Paid order required' };
  return { approved: true };
}

function evaluateCreationAlignment(vision, order) {
  const intent = String(vision?.rawIdea || '').trim();
  return evaluateAlignment('generate_art', {
    authorized: order?.status === 'paid',
    customerIntent: intent.length > 0,
    humanConfirmation: false
  });
}

async function startCreation(order) {
  const vision = visions.get(order.visionId);
  if (!vision) return { status: 'awaiting_vision' };
  const moderation = moderateCreationInput(vision, order);
  if (!moderation.approved) {
    await log('creation_moderated', { orderId: order.id, ...moderation }, order.id);
    return { status: 'moderation_required', moderation };
  }
  const alignment = evaluateCreationAlignment(vision, order);
  if (alignment.decision !== AUTONOMY.AUTO) {
    await log('creation_unaligned', { orderId: order.id, decision: alignment.decision, reason: alignment.reason }, order.id);
    return { status: 'awaiting_confirmation', alignment };
  }
  const result = await runCreationPipeline(vision, order);
  order.artwork = result;
  await log('creation_started', { orderId: order.id, artworkId: result.id, status: result.status }, order.id);
  return result;
}

app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'MercySoul OS',
  version: VERSION,
  verification: 'enabled',
  moderation: 'enabled',
  alignment: 'enforced',
  persistence: storeMode(),
  persistenceRequirement: persistenceRequirement(),
  visionBrain: 'enabled',
  creationEngine: 'enabled',
  adminApi: process.env.ADMIN_API_TOKEN ? 'configured' : 'not_configured',
  paymentWebhook: process.env.NODE_ENV === 'production' ? (process.env.PAYSTACK_SECRET_KEY ? 'configured' : 'not_configured') : 'development'
}));

app.get('/api/status', (_req, res) => res.json({
  service: 'MercySoul OS',
  version: VERSION,
  gateways: ['railway', 'render'],
  pipeline: ['verification', 'moderation', 'alignment', 'creation', 'persistence', 'audit'],
  runtime: { persistence: storeMode(), persistenceRequirement: persistenceRequirement() }
}));

app.post('/api/visions', rateLimit, async (req, res) => {
  const check = verifyVision(req.body);
  if (!check.approved) return res.status(422).json({ approved: false, errors: check.errors });
  const brief = buildCreativeBrief(req.body.rawIdea);
  const moderation = moderateCreationInput({ rawIdea: req.body.rawIdea, brief }, { status: 'paid' });
  if (!moderation.approved) {
    await log('vision_moderated', { reason: moderation.reason, matchedTerm: moderation.matchedTerm || null });
    return res.status(422).json({ approved: false, status: 'moderation_required', moderation: { reason: moderation.reason } });
  }
  const id = `VIS-${crypto.randomUUID()}`;
  const vision = { id, ...req.body, brief, status: 'verified', approval: 'verified', createdAt: new Date().toISOString() };
  const saved = await saveVision(vision);
  if (saved.error) return res.status(500).json({ approved: false, error: 'Vision persistence failed' });
  visions.set(id, vision);
  await log('vision_verified', { id }, id);
  res.status(201).json({ ...vision, persistence: storeMode() });
});

app.get('/api/visions/:id/brief', requireAdmin, (req, res) => {
  const vision = visions.get(req.params.id);
  if (!vision) return res.status(404).json({ error: 'Vision not found' });
  res.json({ visionId: vision.id, brief: vision.brief });
});

app.post('/api/orders', rateLimit, async (req, res) => {
  const check = verifyOrder(req.body);
  if (!check.approved) return res.status(422).json({ approved: false, errors: check.errors });
  if (!visions.has(req.body.visionId)) return res.status(404).json({ approved: false, error: 'Vision not found' });
  const id = `ORD-${crypto.randomUUID()}`;
  const order = { id, ...req.body, status: 'pending_payment', approval: 'verified', createdAt: new Date().toISOString() };
  const saved = await saveOrder(order);
  if (saved.error) return res.status(500).json({ approved: false, error: 'Order persistence failed' });
  orders.set(id, order);
  await log('order_verified', { id }, id);
  res.status(201).json({ ...order, persistence: storeMode() });
});

app.get('/api/orders', requireAdmin, async (_req, res) => {
  const remote = await listOrders();
  if (!remote.error && remote.data) return res.json(remote.data);
  res.json([...orders.values()]);
});
app.get('/api/visions', requireAdmin, (_req, res) => res.json([...visions.values()]));
app.get('/api/events', requireAdmin, (_req, res) => res.json(events.slice(-100)));

app.post('/api/orders/:id/create', requireAdmin, async (req, res) => {
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
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (process.env.NODE_ENV === 'production' && !secret) return res.status(503).json({ error: 'Payment webhook is not configured' });
  const signature = req.headers['x-paystack-signature'];
  if (secret) {
    const expected = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (!signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).json({ error: 'Invalid signature' });
  }
  const data = req.body?.data || {};
  if (!paymentApproval(data)) return res.sendStatus(200);
  const paymentKey = String(data.reference || '');
  if (!paymentKey) return res.sendStatus(200);
  if (processedPayments.has(paymentKey)) return res.sendStatus(200);
  processedPayments.add(paymentKey);
  let matched = false;
  for (const order of orders.values()) {
    if (order.reference === data.reference || order.id === data.metadata?.orderId) {
      matched = true;
      order.status = 'paid';
      order.payment = { reference: data.reference, status: data.status, verifiedAt: new Date().toISOString() };
      await log('payment_verified', { orderId: order.id, reference: data.reference }, order.id);
      try { await startCreation(order); } catch (error) { await log('creation_failed', { orderId: order.id, error: error.message }, order.id); }
    }
  }
  if (!matched) await log('payment_unmatched', { reference: data.reference });
  res.sendStatus(200);
});

app.get('/', (_req, res) => res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>MercySoul OS</title><style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:20px}textarea,button{width:100%;padding:12px;margin:7px 0;box-sizing:border-box}button{cursor:pointer}.card{padding:16px;border:1px solid #ddd;border-radius:12px;margin-top:16px}pre{white-space:pre-wrap}</style></head><body><h1>MercySoul OS 2.1</h1><p>You describe it. MercySoul structures it, verifies it, aligns it, and prepares it for creation.</p><textarea id="vision" rows="7" placeholder="Describe what you imagine..."></textarea><button onclick="capture()">Verify & Build Creative Brief</button><div id="out"></div><script>async function capture(){const vision=document.getElementById('vision').value;const r=await fetch('/api/visions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawIdea:vision})});const d=await r.json();const pre=document.createElement('pre');pre.textContent=JSON.stringify(d,null,2);const card=document.createElement('div');card.className='card';card.appendChild(pre);document.getElementById('out').replaceChildren(card);}</script></body></html>`));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MercySoul OS ${VERSION} listening on ${port} | persistence=${storeMode()} | requirement=${persistenceRequirement()}`));
