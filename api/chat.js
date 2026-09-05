import multer from 'multer';
import { checkRateLimit } from '@vercel/firewall';
import { validateChatRequest, validateMessage, validateOrigin, securityHeaders } from '../src/api-security.js';

export const config = { api: { bodyParser: false } };

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-3.7-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VERCEL_RATE_LIMIT_ID = process.env.VERCEL_RATE_LIMIT_ID?.trim();
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 12000;
const GEMINI_RETRY_DELAYS_MS = [1000];

const SYSTEM_PROMPT = `You are the MercySoul Concierge. You answer briefly and warmly in 1-3 sentences.
NEVER output raw markdown (no **bold**, no bullet points, no numbered lists).
NEVER output raw URLs or links in your text.
NEVER mention the full price list.
When the user asks about prices or payments, say: "I can help you with that. Please click the 'Chat on WhatsApp' button below, and the founder will send you the full catalog and pricing."
Always end with "Aṣẹ".`;

const PRICE_PAYMENT_PATTERN = /\b(price|prices|pricing|cost|costs|how much|payment|pay|paying|catalog|catalogue|fee|fees)\b/i;
const OGBE_GATE_BLOCKED_PATTERNS = [
  /\b(kill|murder|assassinate|bomb|terrorize|terrorise)\b/i,
  /\b(hurt|harm|attack|threaten)\s+(someone|somebody|him|her|them|people|person)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i,
];

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

function ensureAse(text) {
  let cleaned = String(text || '').trim();
  if (!cleaned) cleaned = 'Please tell me what you need and I will be happy to help.';
  cleaned = cleaned
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/Aṣẹ\.?\s*$/iu, '')
    .trim();
  return `${cleaned}\n\nAṣẹ.`;
}

function isPriceOrPaymentRequest(message) { return PRICE_PAYMENT_PATTERN.test(message); }
function ogbeGate(message) { return OGBE_GATE_BLOCKED_PATTERNS.some((pattern) => pattern.test(message)); }

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
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'x-goog-api-client': 'mercysoul/1.0' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      lastResponse = response;
      lastData = data;
      if (response.ok) return { response, data };
      if (response.status === 429) break;
      if (response.status === 503 && attempt < GEMINI_RETRY_DELAYS_MS.length) {
        console.warn('[MercySoul Gemini]', JSON.stringify({ event: 'gemini_retry', status: response.status, attempt: attempt + 1, nextDelayMs: GEMINI_RETRY_DELAYS_MS[attempt], model: MODEL, requestId: context.requestId, hasPdf }));
        await sleep(GEMINI_RETRY_DELAYS_MS[attempt]);
        continue;
      }
      break;
    } catch (error) {
      const timedOut = error?.name === 'AbortError';
      console.error('[MercySoul Security]', JSON.stringify({ event: timedOut ? 'gemini_timeout' : 'gemini_request_failed', requestId: context.requestId, attempt: attempt + 1, timeoutMs: GEMINI_TIMEOUT_MS, error: String(error?.message || error) }));
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
  if (req.method !== 'POST') return res.status(405).json({ reply: 'Method not allowed. Aṣẹ.' });
  if (!context.allowed) { res.setHeader('Retry-After', String(context.retryAfter || 10)); return res.status(context.status || 429).json({ reply: 'Too many requests. Please try again shortly. Aṣẹ.' }); }
  if (!validateOrigin(req)) return res.status(403).json({ reply: 'Request origin is not authorized. Aṣẹ.' });
  if (!(await enforceVercelRateLimit(req, context))) { res.setHeader('Retry-After', '60'); return res.status(429).json({ reply: 'Traffic limit reached. Please try again shortly. Aṣẹ.' }); }

  const apiKey = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Aṣẹ.' });
  const isMultipart = String(req.headers['content-type'] || '').toLowerCase().startsWith('multipart/form-data');
  try {
    if (isMultipart) await parseMultipart(req);
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ reply: 'PDF is too large. Maximum size is 50 MB. Aṣẹ.' });
    if (error?.code === 'LIMIT_FILE_COUNT' || error?.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ reply: 'Please upload one PDF file only. Aṣẹ.' });
    return res.status(400).json({ reply: 'Unable to process the uploaded PDF. Please select a valid PDF and try again. Aṣẹ.' });
  }

  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Aṣẹ.' });
    if (ogbeGate(message)) return res.status(400).json({ reply: ensureAse('The Ogbe Gate has rejected this input. Please choose a peaceful, truthful, or creative request.') });
    if (isPriceOrPaymentRequest(message)) return res.status(200).json({ reply: "I can help you with that. Please click the 'Chat on WhatsApp' button below, and the founder will send you the full catalog and pricing.\n\nAṣẹ.", concierge: true });

    const uploadedFile = req.file;
    if (uploadedFile && uploadedFile.mimetype !== 'application/pdf' && !uploadedFile.originalname?.toLowerCase().endsWith('.pdf')) return res.status(415).json({ reply: 'Only PDF documents are supported. Aṣẹ.' });
    const userParts = [{ text: message }];
    if (uploadedFile) userParts.push({ inline_data: { mime_type: 'application/pdf', data: uploadedFile.buffer.toString('base64') } });
    const contents = [{ role: 'user', parts: userParts }];
    const { response, data } = await fetchGeminiWithRetry({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents }, apiKey, context, Boolean(uploadedFile));
    if (!response) return res.status(503).json({ reply: 'MercySoul is temporarily unable to connect to its AI service. Please try again in a moment. Aṣẹ.' });
    if (!response.ok) {
      const apiError = data?.error || {};
      const apiMessage = apiError.message || '';
      console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_error', status: response.status, statusText: response.statusText, model: MODEL, requestId: context.requestId, hasPdf: Boolean(uploadedFile), errorMessage: String(apiMessage).slice(0, 500) }));
      if (response.status === 400 && uploadedFile) return res.status(400).json({ reply: 'MercySoul could not process this PDF. Please upload a valid text-readable PDF and try again. Aṣẹ.' });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'MercySoul AI credentials were rejected. Please check the configured Gemini API key. Aṣẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `The configured Gemini model "${MODEL}" is unavailable. Please set GEMINI_MODEL to a model enabled for this API key. Aṣẹ.` });
      if (response.status === 429) return res.status(503).json({ reply: 'MercySoul AI is temporarily out of Gemini quota. Please try again after the quota resets or configure a Gemini API key with available quota. Aṣẹ.' });
      if (response.status === 503) return res.status(503).json({ reply: 'MercySoul AI is temporarily busy. Please try again in a moment. Aṣẹ.' });
      return res.status(502).json({ reply: `MercySoul AI request failed (${response.status}). ${apiMessage || 'Please try again shortly.'} Aṣẹ.` });
    }
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join(' ').trim() || '';
    return res.status(200).json({ reply: ensureAse(text), concierge: true });
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'chat_handler_error', requestId: context.requestId, error: String(error?.message || error), stack: String(error?.stack || '').slice(0, 1500) }));
    return res.status(500).json({ reply: 'MercySoul chat encountered a temporary server error. Please try again in a moment. Aṣẹ.' });
  }
}
