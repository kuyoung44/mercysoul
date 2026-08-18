import express from 'express';
import crypto from 'node:crypto';

const app = express();
app.use(express.json({ limit: '2mb' }));

const orders = new Map();
const visions = new Map();

app.get('/health', (_req, res) => res.json({ ok: true, service: 'MercySoul OS', version: '1.0.0' }));

app.post('/api/visions', (req, res) => {
  const id = `VIS-${crypto.randomUUID()}`;
  const vision = { id, ...req.body, status: 'captured', createdAt: new Date().toISOString() };
  visions.set(id, vision);
  res.status(201).json(vision);
});

app.post('/api/orders', (req, res) => {
  const id = `ORD-${crypto.randomUUID()}`;
  const order = { id, ...req.body, status: 'pending_payment', createdAt: new Date().toISOString() };
  orders.set(id, order);
  res.status(201).json(order);
});

app.get('/api/orders', (_req, res) => res.json([...orders.values()]));
app.get('/api/visions', (_req, res) => res.json([...visions.values()]));

app.post('/api/payments/webhook', (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (process.env.PAYSTACK_SECRET_KEY) {
    const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (signature !== expected) return res.status(401).json({ error: 'Invalid signature' });
  }
  const data = req.body?.data || {};
  const reference = data.reference;
  for (const order of orders.values()) {
    if (order.reference === reference || order.id === data.metadata?.orderId) {
      order.status = data.status === 'success' ? 'paid' : order.status;
      order.payment = data;
    }
  }
  res.sendStatus(200);
});

app.get('/', (_req, res) => res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>MercySoul OS</title><style>body{font-family:system-ui;max-width:760px;margin:40px auto;padding:20px}input,textarea,button{width:100%;padding:12px;margin:7px 0;box-sizing:border-box}button{cursor:pointer}</style></head><body><h1>MercySoul OS</h1><p>You describe it. MercySoul brings it into visual form.</p><textarea id="vision" rows="7" placeholder="Describe what you imagine..."></textarea><button onclick="capture()">Capture Vision</button><pre id="out"></pre><script>async function capture(){const vision=document.getElementById('vision').value;const r=await fetch('/api/visions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rawIdea:vision})});document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2)}</script></body></html>`));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MercySoul OS listening on ${port}`));
