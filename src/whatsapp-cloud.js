import crypto from 'node:crypto';
import { runMercySoulBot } from './agent/mercysoul-bot.js';

const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';
const APP_SECRET = process.env.META_APP_SECRET;

export function whatsappStatus() {
  return {
    enabled: Boolean(VERIFY_TOKEN && ACCESS_TOKEN && PHONE_NUMBER_ID),
    configured: {
      verifyToken: Boolean(VERIFY_TOKEN),
      accessToken: Boolean(ACCESS_TOKEN),
      phoneNumberId: Boolean(PHONE_NUMBER_ID),
      appSecret: Boolean(APP_SECRET),
    },
    webhook: '/api/wa-webhook',
    gateway: 'https://mercy-vision.vercel.app',
  };
}

function verifySignature(body, signature) {
  if (!APP_SECRET) return true;
  if (!signature?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
  const received = signature.slice(7);
  return received.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function sendWhatsAppMessage(to, text) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) throw new Error('WhatsApp Cloud API credentials are not configured');
  const url = `https://graph.facebook.com/${encodeURIComponent(GRAPH_VERSION)}/${encodeURIComponent(PHONE_NUMBER_ID)}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${ACCESS_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: text },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp send failed: ${response.status}`);
  return response.json();
}

export async function handleWhatsAppWebhook(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && token === VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.sendStatus(403);
  }

  const rawBody = JSON.stringify(req.body || {});
  if (!verifySignature(rawBody, req.get('x-hub-signature-256'))) return res.sendStatus(403);
  if (req.body?.object !== 'whatsapp_business_account') return res.sendStatus(404);

  res.sendStatus(200);
  for (const entry of req.body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        const from = message.from;
        const text = message.type === 'text' ? message.text?.body?.trim() : '';
        if (!from || !text) continue;
        try {
          const bot = await runMercySoulBot({ message: text, phone: from, senderId: from });
          if (bot.reply) await sendWhatsAppMessage(from, bot.reply);
        } catch (error) {
          console.error('WhatsApp Cloud webhook error:', error instanceof Error ? error.message : error);
        }
      }
    }
  }
}
