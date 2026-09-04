import chatHandler from './chat.js';

const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION?.trim() || 'v23.0';
const GRAPH_MESSAGES_URL = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages`;

function jsonResponse(res, status, body) {
  return res.status(status).json(body);
}

async function generateReply(req, message) {
  let captured = null;
  const response = {
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { captured = { status: this.statusCode || 200, body }; return this; },
    send(body) { captured = { status: this.statusCode || 200, body }; return this; },
  };

  const chatRequest = Object.assign(Object.create(Object.getPrototypeOf(req)), req, {
    method: 'POST',
    body: { message },
  });
  chatRequest.headers = { ...req.headers, 'content-type': 'application/json' };

  await chatHandler(chatRequest, response);
  if (!captured) throw new Error('Gemini chat handler returned no response');
  if (captured.status < 200 || captured.status >= 300) {
    throw new Error(captured.body?.reply || 'Gemini chat request failed');
  }
  return String(captured.body?.reply || '').trim();
}

async function sendMessengerMessage(recipientId, text, pageAccessToken) {
  const response = await fetch(`${GRAPH_MESSAGES_URL}?access_token=${encodeURIComponent(pageAccessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text } }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Facebook Send API returned ${response.status}`);
  }
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

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return jsonResponse(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const pageAccessToken = String(process.env.PAGE_ACCESS_TOKEN || '').trim();
  if (!pageAccessToken) return jsonResponse(res, 500, { ok: false, error: 'PAGE_ACCESS_TOKEN is not configured' });

  try {
    const body = req.body || {};
    if (body.object !== 'page') return jsonResponse(res, 404, { ok: false, error: 'Unsupported webhook object' });

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        if (event.message?.is_echo) continue;
        const senderId = event.sender?.id;
        const text = typeof event.message?.text === 'string' ? event.message.text.trim() : '';
        if (!senderId || !text) continue;

        const reply = await generateReply(req, text);
        if (reply) await sendMessengerMessage(senderId, reply, pageAccessToken);
      }
    }

    return jsonResponse(res, 200, { ok: true, received: true });
  } catch (error) {
    console.error('[MercySoul Facebook]', error);
    return jsonResponse(res, 500, { ok: false, error: 'Unable to process Facebook Messenger event' });
  }
}
