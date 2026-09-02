import crypto from 'node:crypto';
import multer from 'multer';
import { checkRateLimit } from '@vercel/firewall';
import { validateChatRequest, validateMessage, validateOrigin, securityHeaders } from '../src/api-security.js';
import { RAG_LITE_SYSTEM_PROMPT } from '../src/rag-lite.js';

export const config = {
  api: { bodyParser: false },
};

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VERCEL_RATE_LIMIT_ID = process.env.VERCEL_RATE_LIMIT_ID?.trim();
const HUMAN_SUPPORT_EMAIL = process.env.HUMAN_SUPPORT_EMAIL?.trim() || 'the configured human support email';
const MAX_PDF_SIZE = 50 * 1024 * 1024;

const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');
    cb(null, isPdf);
  },
});

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    pdfUpload.single('file')(req, {}, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

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

const OGBE_GATE_BLOCKED_PATTERNS = [
  /\b(kill|murder|assassinate|bomb|terrorize|terrorise)\b/i,
  /\b(hurt|harm|attack|threaten)\s+(someone|somebody|him|her|them|people|person)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i,
];

function ensureAse(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return 'Please contact Founder Anuoluwapo via WhatsApp or Facebook to place your order. Aṣẹ.';
  return /Aṣẹ\.$/.test(cleaned) ? cleaned : `${cleaned.replace(/Aṣẹ\.?$/i, '').trim()} Aṣẹ.`;
}

function ogbeGate(message) {
  return OGBE_GATE_BLOCKED_PATTERNS.some((pattern) => pattern.test(message));
}

function crmResponse(message) {
  const normalized = message.trim();
  const upper = normalized.toUpperCase();

  if (upper === 'MENU' || upper.startsWith('MENU ')) {
    return ensureAse([
      'MercySoul Menu',
      '• Custom digital talisman — ₦5,000 each',
      '• Custom wallpaper — ₦5,000 each',
      '• Custom AI chatbot for businesses — ₦50,000',
      '',
      'Reply ORDER to begin an enquiry.'
    ].join('\n'));
  }

  if (upper === 'STATUS') return ensureAse('Please send your Order ID so I can check the order status.');
  if (upper.startsWith('STATUS ') || /^(ORDER\s*ID|ORDERID)\s*[:#-]?\s*\S+/i.test(normalized)) {
    return ensureAse('Your order is being processed.');
  }
  if (upper === 'TALK') return ensureAse(`Please send your email address. Human support email: ${HUMAN_SUPPORT_EMAIL}.`);
  if (upper === 'HUMAN') return ensureAse('I am connecting you to a live agent immediately.');
  return null;
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
  if (!context.allowed) {
    res.setHeader('Retry-After', String(context.retryAfter || 10));
    return res.status(context.status || 429).json({ reply: 'Too many requests. Please try again shortly. Aṣẹ.' });
  }
  if (!validateOrigin(req)) {
    console.warn('[MercySoul Security]', JSON.stringify({ event: 'origin_rejected', ipHash: context.ipHash, requestId: context.requestId }));
    return res.status(403).json({ reply: 'Request origin is not authorized. Aṣẹ.' });
  }
  if (!(await enforceVercelRateLimit(req, context))) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ reply: 'Traffic limit reached. Please try again shortly. Aṣẹ.' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Aṣẹ.' });

  const isMultipart = String(req.headers['content-type'] || '').toLowerCase().startsWith('multipart/form-data');
  try {
    if (isMultipart) await parseMultipart(req);
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ reply: 'PDF is too large. Maximum size is 50 MB. Aṣẹ.' });
    if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ reply: 'Please upload one PDF file only. Aṣẹ.' });
    return res.status(400).json({ reply: 'Unable to process the uploaded PDF. Please select a valid PDF and try again. Aṣẹ.' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Aṣẹ.' });

  // Ogbe Gate: reject clearly harmful/chaotic requests before CRM or Gemini processing.
  if (ogbeGate(message)) {
    return res.status(400).json({ reply: ensureAse('The Ogbe Gate has rejected this input. Please choose a peaceful, truthful, or creative request.') });
  }

  const crmReply = crmResponse(message);
  if (crmReply) return res.status(200).json({ reply: crmReply, crm: true });

  const uploadedFile = req.file;
  if (uploadedFile && uploadedFile.mimetype !== 'application/pdf' && !uploadedFile.originalname?.toLowerCase().endsWith('.pdf')) {
    return res.status(415).json({ reply: 'Only PDF documents are supported. Aṣẹ.' });
  }

  const documentUri = !isMultipart && typeof req.body?.documentUri === 'string' ? req.body.documentUri.trim() : '';
  const hasPdf = Boolean(uploadedFile);
  const systemInstruction = hasPdf || documentUri ? RAG_LITE_SYSTEM_PROMPT : SYSTEM_PROMPT;

  const userParts = [{ text: message }];
  if (hasPdf) {
    userParts.push({
      inline_data: {
        mime_type: 'application/pdf',
        data: uploadedFile.buffer.toString('base64'),
      },
    });
  } else if (documentUri) {
    return res.status(400).json({ reply: 'Direct document URI mode is no longer supported. Upload the PDF with the Upload Document control. Aṣẹ.' });
  }

  const contents = [{ role: 'user', parts: userParts }];

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_error', status: response.status, model: MODEL, requestId: context.requestId, ragLite: hasPdf }));
      const apiMessage = data?.error?.message || '';
      if (response.status === 400 && hasPdf) return res.status(502).json({ reply: ensureAse(`Gemini rejected the PDF input. ${apiMessage || 'Please try another PDF.'}`) });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'Gemini authentication failed. Check the GEMINI_API_KEY configured in Vercel. Aṣẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Aṣẹ.` });
      if (response.status === 429) return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly. Aṣẹ.' });
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
    if (!reply) return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Aṣẹ.' });
    return res.status(200).json({ reply: ensureAse(reply), ragLite: hasPdf });
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_request_failed', requestId: context.requestId, ragLite: hasPdf, error: String(error?.message || error) }));
    return res.status(500).json({ reply: 'Connection error. Try again later. Aṣẹ.' });
  }
}
