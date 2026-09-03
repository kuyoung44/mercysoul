import multer from 'multer';
import { checkRateLimit } from '@vercel/firewall';
import { validateChatRequest, validateMessage, validateOrigin, securityHeaders } from '../src/api-security.js';
import { RAG_LITE_SYSTEM_PROMPT } from '../src/rag-lite.js';

export const config = { api: { bodyParser: false } };

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-3.7-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VERCEL_RATE_LIMIT_ID = process.env.VERCEL_RATE_LIMIT_ID?.trim();
const HUMAN_SUPPORT_EMAIL = process.env.HUMAN_SUPPORT_EMAIL?.trim() || 'the configured human support email';
const WHATSAPP_URL = 'https://wa.me/2348135278110';
const WHATSAPP_LINK = `[Click here to chat with us on WhatsApp](${WHATSAPP_URL})`;
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const GEMINI_RETRY_DELAYS_MS = [1000, 2000, 4000];

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

const SYSTEM_PROMPT = `You are the official MercySoul Vision Brain, the premium creative intelligence of MercySoul. You represent the Founder, Anuoluwapo Adeoye.

Brand essence: "Where Imagination Becomes Sacred Art."

Your role is to welcome people warmly, understand what they need, and guide prospective customers toward the right MercySoul service and the next step toward payment. Speak as a premium, spiritual, warm, confident brand: calm, refined, intentional, and never pushy or desperate.

When introducing yourself, always refer to yourself as the "MercySoul Vision Brain". Do not introduce yourself as a generic AI assistant or as the old "MercySoul Sales Concierge".

Services and fixed prices:
- **MercySoul Bot (Customer Assistant)** — ₦150,000
- **MercySoul Build Flash (Website Generator)** — ₦100,000
- **MercySoul Vision Brain (Custom Art)** — ₦5,000 per image
- **MercySoul News Gate (Company Site)** — ₦75,000
- **MercySoul Enterprise Framework** — ₦750,000

Present information cleanly for mobile readers. Use concise Markdown: **bold headers** for sections, short paragraphs, and bullet points for services and pricing. Keep spacing intentional and avoid dense walls of text. Do not use excessive decoration, repeated symbols, or awkward line breaks.

Always greet customers warmly, ask what their business or creative need is, recommend the best product for their needs, and direct them to DM or WhatsApp to pay when appropriate.

The official WhatsApp destination is exactly: ${WHATSAPP_URL}
When directing a customer to WhatsApp, ALWAYS use this exact Markdown link: ${WHATSAPP_LINK}
Do not output the WhatsApp URL as plain text when a clickable Markdown link can be used.
Do not invent a different WhatsApp number, DM destination, discount, alternative price, guarantee, delivery date, or additional service that has not been provided by the system.

Do not claim that an order or payment has been completed unless the system explicitly confirms it. If a customer asks something unrelated to purchasing MercySoul services, politely bring the conversation back to their business or creative needs and the available services.

Every response MUST end with the exact word "Asẹ." (lowercase dotted e: ẹ), including the final period. Never use "Ase.", "Aṣẹ.", or any other spelling as the signature ending.`;

const OGBE_GATE_BLOCKED_PATTERNS = [
  /\b(kill|murder|assassinate|bomb|terrorize|terrorise)\b/i,
  /\b(hurt|harm|attack|threaten)\s+(someone|somebody|him|her|them|people|person)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i,
];

function ensureAse(text, includeWhatsApp = false) {
  let cleaned = String(text || '').trim();
  if (!cleaned) cleaned = 'Please tell me what your business needs so I can recommend the right MercySoul service.';

  cleaned = cleaned
    .replace(new RegExp(`\\[Click here to chat with us on WhatsApp\\]\\(${WHATSAPP_URL.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\)`, 'g'), '')
    .replace(/As[ẹṣẹ]\.\s*$/iu, '')
    .trim();

  if (includeWhatsApp) return `${cleaned}\n\n${WHATSAPP_LINK}\n\nAsẹ.`;
  return `${cleaned}\n\nAsẹ.`;
}

function ogbeGate(message) { return OGBE_GATE_BLOCKED_PATTERNS.some((pattern) => pattern.test(message)); }

function crmResponse(message) {
  const normalized = message.trim();
  const upper = normalized.toUpperCase();
  if (upper === 'MENU' || upper.startsWith('MENU ')) return ensureAse([
    '**MercySoul Services**',
    '',
    '- **MercySoul Bot (Customer Assistant)** — ₦150,000',
    '- **MercySoul Build Flash (Website Generator)** — ₦100,000',
    '- **MercySoul Vision Brain (Custom Art)** — ₦5,000 per image',
    '- **MercySoul News Gate (Company Site)** — ₦75,000',
    '- **MercySoul Enterprise Framework** — ₦750,000',
    '',
    'Tell me what your business needs and I will recommend the best option.',
  ].join('\n'), true);
  if (upper === 'STATUS') return ensureAse('Please tell me what service you are interested in so I can help you with the next sales step.');
  if (upper.startsWith('STATUS ') || /^(ORDER\s*ID|ORDERID)\s*[:#-]?\s*\S+/i.test(normalized)) return ensureAse(`For an order enquiry, please DM or WhatsApp the Founder with your service and order details.\n\n${WHATSAPP_LINK}`, true);
  if (upper === 'TALK') return ensureAse(`Please contact the Founder, Anuoluwapo Adeoye, on WhatsApp to continue your purchase.\n\nHuman support email: ${HUMAN_SUPPORT_EMAIL}.`, true);
  if (upper === 'HUMAN') return ensureAse('Please contact the Founder, Anuoluwapo Adeoye, on WhatsApp to continue your purchase.', true);
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

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function fetchGeminiWithRetry(payload, apiKey, context, hasPdf) {
  let lastResponse = null;
  let lastData = {};

  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'x-goog-api-client': 'mercysoul/1.0',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      lastResponse = response;
      lastData = data;

      if (response.ok) return { response, data };

      if ((response.status === 429 || response.status === 503) && attempt < GEMINI_RETRY_DELAYS_MS.length) {
        console.warn('[MercySoul Gemini]', JSON.stringify({
          event: 'gemini_retry', status: response.status, attempt: attempt + 1,
          nextDelayMs: GEMINI_RETRY_DELAYS_MS[attempt], model: MODEL,
          requestId: context.requestId, ragLite: hasPdf,
        }));
        await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      break;
    } catch (error) {
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_request_failed', requestId: context.requestId, ragLite: hasPdf, attempt: attempt + 1, error: String(error?.message || error) }));
      if (attempt < GEMINI_RETRY_DELAYS_MS.length) {
        await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw error;
    }
  }
  return { response: lastResponse, data: lastData };
}

export default async function handler(req, res) {
  securityHeaders(res);
  const context = validateChatRequest(req);
  res.setHeader('x-request-id', context.requestId);

  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed. Asẹ.' });
  if (!context.allowed) { res.setHeader('Retry-After', String(context.retryAfter || 10)); return res.status(context.status || 429).json({ reply: 'Too many requests. Please try again shortly. Asẹ.' }); }
  if (!validateOrigin(req)) { console.warn('[MercySoul Security]', JSON.stringify({ event: 'origin_rejected', ipHash: context.ipHash, requestId: context.requestId })); return res.status(403).json({ reply: 'Request origin is not authorized. Asẹ.' }); }
  if (!(await enforceVercelRateLimit(req, context))) { res.setHeader('Retry-After', '60'); return res.status(429).json({ reply: 'Traffic limit reached. Please try again shortly. Asẹ.' }); }

  const apiKey = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Asẹ.' });

  const isMultipart = String(req.headers['content-type'] || '').toLowerCase().startsWith('multipart/form-data');
  try {
    if (isMultipart) await parseMultipart(req);
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ reply: 'PDF is too large. Maximum size is 50 MB. Asẹ.' });
    if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ reply: 'Please upload one PDF file only. Asẹ.' });
    return res.status(400).json({ reply: 'Unable to process the uploaded PDF. Please select a valid PDF and try again. Asẹ.' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Asẹ.' });
  if (ogbeGate(message)) return res.status(400).json({ reply: ensureAse('The Ogbe Gate has rejected this input. Please choose a peaceful, truthful, or creative request.') });

  const crmReply = crmResponse(message);
  if (crmReply) return res.status(200).json({ reply: crmReply, crm: true });

  const uploadedFile = req.file;
  if (uploadedFile && uploadedFile.mimetype !== 'application/pdf' && !uploadedFile.originalname?.toLowerCase().endsWith('.pdf')) return res.status(415).json({ reply: 'Only PDF documents are supported. Asẹ.' });

  const documentUri = !isMultipart && typeof req.body?.documentUri === 'string' ? req.body.documentUri.trim() : '';
  const hasPdf = Boolean(uploadedFile);
  const systemInstruction = hasPdf || documentUri ? RAG_LITE_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const userParts = [{ text: message }];
  if (hasPdf) userParts.push({ inline_data: { mime_type: 'application/pdf', data: uploadedFile.buffer.toString('base64') } });
  else if (documentUri) return res.status(400).json({ reply: 'Direct document URI mode is no longer supported. Upload the PDF with the Upload Document control. Asẹ.' });

  const contents = [{ role: 'user', parts: userParts }];

  try {
    const { response, data } = await fetchGeminiWithRetry({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents }, apiKey, context, hasPdf);

    if (!response) return res.status(502).json({ reply: 'MercySoul is having trouble connecting to its AI service right now. Please try again in a moment. Asẹ.' });

    if (!response.ok) {
      const apiError = data?.error || {};
      const reason = Array.isArray(apiError.details) ? apiError.details.find((detail) => detail?.reason)?.reason : undefined;
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_error', status: response.status, statusText: response.statusText, model: MODEL, requestId: context.requestId, ragLite: hasPdf, errorMessage: String(apiError.message || '').slice(0, 500), reason: reason || null, service: apiError.details?.find?.((detail) => detail?.metadata?.service)?.metadata?.service || null }));
      const apiMessage = apiError.message || '';
      if (response.status === 400 && hasPdf) return res.status(502).json({ reply: ensureAse(`Gemini rejected the PDF input. ${apiMessage || 'Please try another PDF.'}`) });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'Gemini authentication or project access was rejected. Verify that the Vercel production GEMINI_API_KEY is the current Gemini API Auth key and that the key/project is authorized for the Gemini API. Asẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Asẹ.` });
      if (response.status === 429 || response.status === 503) return res.status(503).json({ reply: 'MercySoul is experiencing unusually high AI traffic right now. Please try again in a moment. Asẹ.' });
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
    if (!reply) return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Asẹ.' });
    return res.status(200).json({ reply: ensureAse(reply, true), ragLite: hasPdf });
  } catch (error) {
    return res.status(503).json({ reply: 'MercySoul is temporarily unable to connect to its AI service. Please try again in a moment. Asẹ.' });
  }
}
