import crypto from 'node:crypto';
import { checkRateLimit } from '@vercel/firewall';
import { validateChatRequest, validateMessage, validateOrigin, securityHeaders } from '../src/api-security.js';
import { RAG_LITE_SYSTEM_PROMPT, isValidGeminiFileUri } from '../src/rag-lite.js';

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VERCEL_RATE_LIMIT_ID = process.env.VERCEL_RATE_LIMIT_ID?.trim();

const SYSTEM_PROMPT = `You are the MercySoul Dominion Sales Assistant, the official sales assistant for MercySoul.

Your purpose is to sell and explain MercySoul's digital creative and AI services.

Services and fixed prices:
- Custom digital talisman: ₦5,000 each.
- Custom wallpaper: ₦5,000 each.
- Custom AI chatbot for businesses: ₦50,000.

When people ask about MercySoul services or prices, quote these prices confidently and clearly. Do not invent discounts, alternative prices, guarantees, delivery dates, or additional services.

For orders and serious enquiries, direct clients to contact the Founder, Anuoluwapo, directly via WhatsApp or Facebook to place an order. Do not invent a WhatsApp number, Facebook URL, or other contact details that have not been provided by the system.

Be warm, concise, professional, and sales-focused. Explain the value of the service and ask a brief qualifying question when useful. Never claim an order or payment has been completed unless the system explicitly confirms it.

Every response MUST end with the exact phrase "Aṣẹ."`;

function ensureAse(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return 'Please contact Founder Anuoluwapo via WhatsApp or Facebook to place your order. Aṣẹ.';
  return /Aṣẹ\.$/.test(cleaned) ? cleaned : `${cleaned.replace(/Aṣẹ\.?$/i, '').trim()} Aṣẹ.`;
}

async function enforceVercelRateLimit(req, context) {
  if (!VERCEL_RATE_LIMIT_ID) return true;
  try {
    const { rateLimited } = await checkRateLimit(VERCEL_RATE_LIMIT_ID, { request: req });
    if (rateLimited) {
      console.warn('[MercySoul Security]', JSON.stringify({ event: 'vercel_rate_limit', at: new Date().toISOString(), ipHash: context.ipHash, requestId: context.requestId }));
      return false;
    }
    return true;
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'vercel_rate_limit_error', requestId: context.requestId, error: String(error?.message || error) }));
    return process.env.VERCEL_RATE_LIMIT_FAIL_CLOSED !== 'true';
  }
}

export default async function handler(req, res) {
  securityHeaders(res);
  const context = validateChatRequest(req);
  res.setHeader('x-request-id', context.requestId);

  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed. Aṣẹ.' });
  if (!context.allowed) { res.setHeader('Retry-After', String(context.retryAfter || 10)); return res.status(context.status || 429).json({ reply: 'Too many requests. Please try again shortly. Aṣẹ.' }); }
  if (!validateOrigin(req)) { console.warn('[MercySoul Security]', JSON.stringify({ event: 'origin_rejected', ipHash: context.ipHash, requestId: context.requestId })); return res.status(403).json({ reply: 'Request origin is not authorized. Aṣẹ.' }); }
  if (!(await enforceVercelRateLimit(req, context))) { res.setHeader('Retry-After', '60'); return res.status(429).json({ reply: 'Traffic limit reached. Please try again shortly. Aṣẹ.' }); }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Aṣẹ.' });
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Aṣẹ.' });

  const documentUri = typeof req.body?.documentUri === 'string' ? req.body.documentUri.trim() : '';
  if (documentUri && !isValidGeminiFileUri(documentUri)) return res.status(400).json({ reply: 'Invalid PDF document URI. Upload the PDF through /api/upload-docs first. Aṣẹ.' });

  const systemInstruction = documentUri ? RAG_LITE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const contents = [{ role: 'user', parts: documentUri
    ? [{ text: message }, { file_data: { mime_type: 'application/pdf', file_uri: documentUri } }]
    : [{ text: message }] }];

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_error', status: response.status, model: MODEL, requestId: context.requestId, ragLite: Boolean(documentUri) }));
      const apiMessage = data?.error?.message || '';
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'Gemini authentication failed. Check the GEMINI_API_KEY configured in Vercel. Aṣẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Aṣẹ.` });
      if (response.status === 429) return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly. Aṣẹ.' });
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }
    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
    if (!reply) return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Aṣẹ.' });
    return res.status(200).json({ reply: documentUri ? reply : ensureAse(reply), ragLite: Boolean(documentUri), documentUri: documentUri || undefined });
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_request_failed', requestId: context.requestId, ragLite: Boolean(documentUri), error: String(error?.message || error) }));
    return res.status(500).json({ reply: 'Connection error. Try again later. Aṣẹ.' });
  }
}
