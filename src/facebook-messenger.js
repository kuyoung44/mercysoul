import crypto from 'node:crypto';
import { runMercySoulBot } from './agent/mercysoul-bot.js';

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL;

export function facebookMessengerStatus() {
  return {
    enabled: Boolean(GRAPH_VERSION && PAGE_ACCESS_TOKEN && VERIFY_TOKEN),
    configured: {
      graphVersion: Boolean(GRAPH_VERSION),
      pageAccessToken: Boolean(PAGE_ACCESS_TOKEN),
      verifyToken: Boolean(VERIFY_TOKEN),
      appSecret: Boolean(APP_SECRET),
      gemini: Boolean(GEMINI_API_KEY && GEMINI_MODEL),
    },
    webhook: '/api/fb-webhook',
    gateway: 'https://mercy-vision.vercel.app',
  };
}

export function verifyFacebookSignature(rawBody, signature) {
  if (!APP_SECRET) return true;
  if (!signature?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
  const received = signature.slice(7);
  return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function generateReply(message) {
  if (!GEMINI_API_KEY || !GEMINI_MODEL) {
    return "Hello. I'm MercySoul Bot. Tell me what you need — business or personal use — and I'll guide you.\n\nVision Brain: https://mercy-vision.vercel.app\nWhatsApp: https://wa.me/2348135278110?text=Hello%20MercySoul%2C%20I'm%20interested%20in%20your%20services\n\nAṣẹ.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const prompt = `You are MercySoul Sales Concierge. Be smart, warm, calm, concise and persuasive. Ask whether the customer needs business or personal use when unclear. Recommend relevant MercySoul services without begging, chasing or manipulation. Direct interested customers to WhatsApp. End with Aṣẹ.\n\nCustomer message:\n${message}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || 'Please contact MercySoul on WhatsApp for assistance.';
}

async function sendFacebookMessage(recipientId, text) {
  if (!GRAPH_VERSION || !PAGE_ACCESS_TOKEN) throw new Error('Facebook Messenger credentials are not configured');
  const url = `https://graph.facebook.com/${encodeURIComponent(GRAPH_VERSION)}/me/messages?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: 'RESPONSE', message: { text } }),
  });
  if (!response.ok) throw new Error(`Facebook send failed: ${response.status}`);
  return response.json();
}

export async function handleFacebookWebhook(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  if (!verifyFacebookSignature(JSON.stringify(req.body || {}), req.get('x-hub-signature-256'))) return res.sendStatus(403);
  if (req.body?.object !== 'page') return res.sendStatus(404);

  res.sendStatus(200);
  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const message = event.message?.text?.trim();
      if (!senderId || !message || event.message?.is_echo) continue;
      try {
        const bot = await runMercySoulBot({ message, senderId });
        const reply = bot.reply || await generateReply(message);
        await sendFacebookMessage(senderId, reply);
      } catch (error) {
        console.error('Facebook Messenger webhook error:', error instanceof Error ? error.message : error);
      }
    }
  }
}
