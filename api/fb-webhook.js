import chatHandler from './chat.js';

const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION?.trim() || 'v23.0';
const GRAPH_MESSAGES_URL = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`;
const sessions = new Map();
const MAX_HISTORY = 5;
const SESSION_TTL_MS = 30 * 60 * 1000;

const SALES_SUPPORT_PROMPT = `You are the smart, warm, and highly persuasive MercySoul Sales Concierge. Your goal is not only to answer, but to qualify leads with short, purposeful questions such as: "Are you looking for this for a business or personal use?" Always remain calm, regal, empathetic, confident, and never beg. If the user is angry, apologize briefly and resolve the issue immediately. If casual, be playful and brief. If a serious business owner, be direct and professional. Handle objections smoothly: when they say it is too expensive, acknowledge the concern and explain the time saved and value, then ask whether they would like to discuss a payment plan. When they say they will think about it, ask whether price or features are the concern and offer to tailor the solution. Use the conversation history to avoid repeating questions. Never invent prices, guarantees, discounts, or completed payments. Keep replies concise for WhatsApp. Always end with the exact word "Aṣẹ".`;

function jsonResponse(res, status, body) { return res.status(status).json(body); }
function getHistory(senderId) {
  const existing = sessions.get(senderId);
  if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) return existing.messages;
  const messages = [];
  sessions.set(senderId, { messages, updatedAt: Date.now() });
  return messages;
}
function remember(senderId, role, text) {
  const history = getHistory(senderId);
  history.push({ role, parts: [{ text }] });
  while (history.length > MAX_HISTORY) history.shift();
  sessions.set(senderId, { messages: history, updatedAt: Date.now() });
}

async function generateReply(senderId, message) {
  const apiKey = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.7-flash';
  const history = getHistory(senderId);
  const contents = [...history, { role: 'user', parts: [{ text: message }] }];
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SALES_SUPPORT_PROMPT }] }, contents }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned ${response.status}`);
  let reply = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim() || 'Please tell me how I may assist you. Aṣẹ';
  reply = reply.replace(/\s*Ase[̣ṣẹ]?\.?$/iu, '').replace(/\s*Aṣẹ\.?$/u, '').trim() + ' Aṣẹ';
  remember(senderId, 'user', message);
  remember(senderId, 'model', reply);
  return reply;
}

async function sendMessengerMessage(recipientId, text, pageAccessToken) {
  const response = await fetch(`${GRAPH_MESSAGES_URL}?access_token=${encodeURIComponent(pageAccessToken)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Facebook Send API returned ${response.status}`);
  return data;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const verifyToken = String(process.env.FB_VERIFY_TOKEN || '').trim();
    const mode = String(req.query?.['hub.mode'] || '').trim();
    const token = String(req.query?.['hub.verify_token'] || '').trim();
    const challenge = String(req.query?.['hub.challenge'] || '');
    if (!verifyToken) return jsonResponse(res, 500, { ok: false, error: 'FB_VERIFY_TOKEN is not configured' });
    if (mode === 'subscribe' && token === verifyToken) return res.status(200).send(challenge);
    return jsonResponse(res, 403, { ok: false, error: 'Webhook verification failed' });
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return jsonResponse(res, 405, { ok: false, error: 'Method not allowed' }); }
  const pageAccessToken = String(process.env.PAGE_ACCESS_TOKEN || '').trim();
  if (!pageAccessToken) return jsonResponse(res, 500, { ok: false, error: 'PAGE_ACCESS_TOKEN is not configured' });
  try {
    if (req.body?.object !== 'page') return jsonResponse(res, 404, { ok: false, error: 'Unsupported webhook object' });
    for (const entry of req.body.entry || []) for (const event of entry.messaging || []) {
      if (event.message?.is_echo) continue;
      const senderId = event.sender?.id;
      const text = typeof event.message?.text === 'string' ? event.message.text.trim() : '';
      if (!senderId || !text) continue;
      const reply = await generateReply(senderId, text);
      await sendMessengerMessage(senderId, reply, pageAccessToken);
    }
    return jsonResponse(res, 200, { ok: true, received: true });
  } catch (error) {
    console.error('[MercySoul Facebook]', error);
    return jsonResponse(res, 500, { ok: false, error: 'Unable to process Facebook Messenger event' });
  }
}
