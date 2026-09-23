import crypto from 'node:crypto';
import OpenAI from 'openai';

const WHATSAPP = 'https://wa.me/2348135278110';
const CATALOG = [
  { name: 'MercySoul Bot', price: '₦150,000', use: 'customer assistant, sales and support automation' },
  { name: 'Build Flash', price: '₦100,000', use: 'website generation and rapid business web builds' },
  { name: 'Vision Brain', price: '₦5,000/image', use: 'premium custom AI art and visual creative work' },
  { name: 'News Gate', price: '₦75,000', use: 'company website and information presence' },
  { name: 'Enterprise Framework', price: '₦750,000', use: 'larger custom AI/business automation systems' },
];

const SYSTEM = 'You are MercySoul Bot, the official customer assistant for MercySoul Dominion.\n' +
  'You are warm, calm, confident, concise and helpful. Understand the customer, explain the relevant service accurately, answer objections honestly, and guide qualified customers toward a clear next step. Never beg, pressure, deceive, manipulate, invent capabilities, invent delivery dates, or claim control of third-party platforms.\n' +
  'When useful, ask whether the request is for business or personal use. Use the supplied catalog for prices. Do not invent discounts. If a customer wants to proceed, offer WhatsApp: ' + WHATSAPP + '. Keep responses mobile-friendly. End completed customer-facing replies with "Aṣẹ." unless the reply already ends with it.\n' +
  'MercySoul tagline: "Where Imagination Becomes Sacred Art."';

const sessions = new Map();
const MAX_MESSAGES = 5;
const MAX_SESSIONS = 500;

function normalize(value) {
  return typeof value === 'string' ? value.trim().slice(0, 4000) : '';
}

function sessionKey(input) {
  return normalize(input.sessionId || input.userId || input.phone || input.senderId) || crypto.randomUUID();
}

function catalogText() {
  return CATALOG.map(x => '- ' + x.name + ': ' + x.price + ' — ' + x.use).join('\n');
}

function fallback(message) {
  const text = message.toLowerCase();
  if (/price|cost|how much|₦|naira/.test(text)) {
    return 'Here is the current MercySoul catalog:\n\n' + catalogText() + '\n\nTell me what you are trying to build, and I will help you choose the relevant service. Aṣẹ.';
  }
  if (/business|company|website|bot|automation/.test(text)) {
    return 'Absolutely. Is this for business or personal use? If it is for a business, tell me what the business does and what you want the system to handle. Aṣẹ.';
  }
  if (/art|portrait|wallpaper|image|creative/.test(text)) {
    return 'Vision Brain handles premium custom AI art at ₦5,000/image. Describe the image you have in mind, including the subject, mood and style. Aṣẹ.';
  }
  return 'Welcome to MercySoul Dominion. Tell me what you want to create or improve, and I will help you choose the right MercySoul path. Aṣẹ.';
}

function trimHistory(history) {
  return history.slice(-MAX_MESSAGES);
}

export function mercysoulBotStatus() {
  return {
    enabled: true,
    service: 'MercySoul Bot',
    role: 'Customer Assistant / Sales Concierge',
    memory: 'last 5 messages per session',
    catalog: CATALOG,
    whatsapp: WHATSAPP,
    modelConfigured: Boolean(process.env.OPENAI_API_KEY),
  };
}

export async function runMercySoulBot({ message, sessionId, userId, phone, senderId } = {}) {
  const userMessage = normalize(message);
  if (!userMessage) return { ok: false, error: 'message is required' };

  const key = sessionKey({ sessionId, userId, phone, senderId });
  let history = sessions.get(key) || [];
  history = trimHistory(history);

  const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
  let reply;

  if (client) {
    const response = await client.responses.create({
      model: process.env.MERCYSOUL_BOT_MODEL || 'gpt-5-mini',
      instructions: SYSTEM + '\n\nCURRENT CATALOG:\n' + catalogText(),
      input: [...history, { role: 'user', content: userMessage }],
      max_output_tokens: 500,
    });
    reply = response.output_text?.trim() || fallback(userMessage);
  } else {
    reply = fallback(userMessage);
  }

  history.push({ role: 'user', content: userMessage }, { role: 'assistant', content: reply });
  sessions.set(key, trimHistory(history));
  if (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value);

  return { ok: true, sessionId: key, reply, whatsapp: WHATSAPP, memory: 'last 5 messages' };
}

export function clearMercySoulBotSession(sessionId) {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
}
