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
const GEMINI_TIMEOUT_MS = 12000;
const GEMINI_RETRY_DELAYS_MS = [1000];
const ABOUT_DESCRIPTION = 'MercySoul Vision Brain is a premium creative technology studio in Nigeria helping Nigerian businesses turn ideas into powerful digital experiences. We provide digital marketing, custom AI art, and professional web design services tailored to ambitious brands, entrepreneurs, and organizations. From compelling visual content and distinctive brand artwork to modern, responsive websites and strategic digital marketing, we combine creativity, technology, and purpose to help your business stand out. Whether you need a striking campaign, custom artwork, a new website, or a stronger online presence, MercySoul Vision Brain brings your vision to life with clarity, elegance, and impact. Where Imagination Becomes Sacred Art. Asẹ.';

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

IDENTITY RESPONSE OVERRIDE: If the customer asks "Who are you?", "Tell me about MercySoul", "What do you do?", or an obvious equivalent asking who MercySoul is or what MercySoul does, reply with the following text EXACTLY, character-for-character. Do not add a greeting, Markdown, WhatsApp button, extra wording, or any other text before or after it:

${ABOUT_DESCRIPTION}

Services and fixed prices:
- **MercySoul Bot (Customer Assistant)** — ₦150,000
- **MercySoul Build Flash (Website Generator)** — ₦100,000
- **MercySoul Vision Brain (Custom Art)** — ₦5,000 per image
- **MercySoul News Gate (Company Site)** — ₦75,000
- **MercySoul Enterprise Framework** — ₦750,000

Present information cleanly for mobile readers. Use concise Markdown: **bold headers** for sections, short paragraphs, and bullet points for services and pricing. Keep spacing intentional and avoid dense walls of text. Do not use excessive decoration, repeated symbols, or awkward line breaks.

Always greet customers warmly, ask what their business or creative need is, recommend the best product for their needs, and direct them to use the WhatsApp button at the bottom of the screen when appropriate.

STRICT LINK/URL RULE: Never display, type, mention, paste, quote, or reproduce any link or URL in your text. Never output a WhatsApp URL, Markdown link, HTML link, domain, phone-number link, or any other clickable URL. Do not describe or spell out the WhatsApp destination. Direct the user only to click the WhatsApp button at the bottom of the screen. The WhatsApp button is the only place where the WhatsApp destination should appear.

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
  // Keep all WhatsApp destinations in the frontend button only. Backend chat text never contains links.
  return `${cleaned}\n\nAsẹ.`;
}

function isAboutMercySoulRequest(message) {
  const normalized = message.trim().toLowerCase().replace(/[?!.,]+$/g, '').replace(/\s+/g, ' ');
  return normalized === 'who are you' || normalized === 'tell me about mercysoul' || normalized === 'what do you do' || normalized === 'who is mercysoul' || normalized === 'what is mercysoul';
}

function ogbeGate(message) { return OGBE_GATE_BLOCKED_PATTERNS.some((pattern) => pattern.test(message)); }

function crmResponse(message) {
  const normalized = message.trim();
  const upper = normalized.toUpperCase();
  if (upper === 'MENU' || upper.startsWith('MENU ')) return ensureAse([
    '**MercySoul Services**', '',
    '- **MercySoul Bot (Customer Assistant)** — ₦150,000',
    '- **MercySoul Build Flash (Website Generator)** — ₦100,000',
    '- **MercySoul Vision Brain (Custom Art)** — ₦5,000 per image',
    '- **MercySoul News Gate (Company Site)** — ₦75,000',
    '- **MercySoul Enterprise Framework** — ₦750,000', '',
    'Tell me what your business needs and I will recommend the best option.',
  ].join('\n'), true);
  if (upper === 'STATUS') return ensureAse('Please tell me what service you are interested in so I can help you with the next sales step.');
  if (upper.startsWith('STATUS ') || /^(ORDER\s*ID|ORDERID)\s*[:#-]?\s*\S+/i.test(normalized)) return ensureAse('For an order enquiry, please use the WhatsApp button at the bottom of the screen with your service and order details.');
  if (upper === 'TALK') return ensureAse(`Please use the WhatsApp button at the bottom of the screen to continue your purchase.\n\nHuman support email: ${HUMAN_SUPPORT_EMAIL}.`);
  if (upper === 'HUMAN') return ensureAse('Please use the WhatsApp button at the bottom of the screen to continue your purchase.');
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const response = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'x-goog-api-client': 'mercysoul/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      lastResponse = response;
      lastData = data;
      if (response.ok) return { response, data };
      if (response.status === 429) break;
      if (response.status === 503 && attempt < GEMINI_RETRY_DELAYS_MS.length) {
        console.warn('[MercySoul Gemini]', JSON.stringify({ event: 'gemini_retry', status: response.status, attempt: attempt + 1, nextDelayMs: GEMINI_RETRY_DELAYS_MS[attempt], model: MODEL, requestId: context.requestId, ragLite: hasPdf }));
        await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      break;
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      console.error('[MercySoul Security]', JSON.stringify({ event: timedOut ? 'gemini_timeout' : 'gemini_request_failed', requestId: context.requestId, ragLite: hasPdf, attempt: attempt + 1, timeoutMs: GEMINI_TIMEOUT_MS, error: String(error?.message || error) }));
      if (!timedOut && attempt < GEMINI_RETRY_DELAYS_MS.length) {
        await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
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

  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Asẹ.' });
    if (ogbeGate(message)) return res.status(400).json({ reply: ensureAse('The Ogbe Gate has rejected this input. Please choose a peaceful, truthful, or creative request.') });
    if (isAboutMercySoulRequest(message)) return res.status(200).json({ reply: ABOUT_DESCRIPTION, crm: true });

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
    const { response, data } = await fetchGeminiWithRetry({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents }, apiKey, context, hasPdf);
    if (!response) return res.status(503).json({ reply: 'MercySoul is temporarily unable to connect to its AI service. Please try again in a moment. Asẹ.' });

    if (!response.ok) {
      const apiError = data?.error || {};
      const reason = Array.isArray(apiError.details) ? apiError.details.find((detail) => detail?.reason)?.reason : undefined;
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_error', status: response.status, statusText: response.statusText, model: MODEL, requestId: context.requestId, ragLite: hasPdf, errorMessage: String(apiError.message || '').slice(0, 500), reason: reason || null, service: apiError.details?.find?.((detail) => detail?.metadata?.service)?.metadata?.service || null }));
      const apiMessage = apiError.message || '';
      if (response.status === 400 && hasPdf) return res.status(400).json({ reply: 'MercySoul could not process this PDF. Please upload a valid text-readable PDF and try again. Asẹ.' });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'MercySoul AI credentials were rejected. Please check the configured Gemini API key. Asẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `The configured Gemini model "${MODEL}" is unavailable. Please set GEMINI_MODEL to a model enabled for this API key. Asẹ.` });
      if (response.status === 429) return res.status(503).json({ reply: 'MercySoul AI is temporarily out of Gemini quota. Please try again after the quota resets or configure a Gemini API key with available quota. Asẹ.' });
      if (response.status === 503) return res.status(503).json({ reply: 'MercySoul AI is temporarily busy. Please try again in a moment. Asẹ.' });
      return res.status(502).json({ reply: `MercySoul AI request failed (${response.status}). ${apiMessage || 'Please try again shortly.'} Asẹ.` });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join(' ').trim() || '';
    return res.status(200).json({ reply: ensureAse(text) });
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'chat_handler_error', requestId: context.requestId, error: String(error?.message || error), stack: String(error?.stack || '').slice(0, 1500) }));
    return res.status(500).json({ reply: 'MercySoul chat encountered a temporary server error. Please try again in a moment. Asẹ.' });
  }
}
