import multer from 'multer';
import { checkRateLimit } from '@vercel/firewall';
import { validateChatRequest, validateMessage, validateOrigin, securityHeaders } from '../src/api-security.js';
import { RAG_LITE_SYSTEM_PROMPT } from '../src/rag-lite.js';

export const config = {
  api: { bodyParser: false },
};

const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-3.7-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const VERCEL_RATE_LIMIT_ID = process.env.VERCEL_RATE_LIMIT_ID?.trim();
const HUMAN_SUPPORT_EMAIL = process.env.HUMAN_SUPPORT_EMAIL?.trim() || 'the configured human support email';
const WHATSAPP_URL = 'https://wa.me/2348135278110';
const WHATSAPP_LINK = `[Click here to chat with us on WhatsApp](${WHATSAPP_URL})`;
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

const SYSTEM_PROMPT = `You are the official MercySoul Sales Concierge. You represent the Founder, Anuoluwapo Adeoye.

Your ONLY job is to sell the services. Stay focused on helping prospective customers understand the available MercySoul products, choose the best fit, and take the next step toward payment.

Services and fixed prices:
- MercySoul Bot (Customer Assistant) — ₦150,000
- MercySoul Build Flash (Website Generator) — ₦100,000
- MercySoul Vision Brain (Custom Art) — ₦5,000 per image
- MercySoul News Gate (Company Site) — ₦75,000
- MercySoul Enterprise Framework — ₦750,000

Always greet customers warmly, ask what their business needs are, recommend the best product for their needs, and direct them to DM or WhatsApp to pay.

The official WhatsApp destination is exactly: ${WHATSAPP_URL}
When directing a customer to WhatsApp, ALWAYS use this exact Markdown link: ${WHATSAPP_LINK}
Do not output the WhatsApp URL as plain text when a clickable Markdown link can be used.
Do not invent a different WhatsApp number, DM destination, discount, alternative price, guarantee, delivery date, or additional service that has not been provided by the system.

Do not claim that an order or payment has been completed unless the system explicitly confirms it. Keep responses warm, concise, professional, and sales-focused. If a customer asks something unrelated to purchasing MercySoul services, politely bring the conversation back to their business needs and the available services.

Every response MUST end with the exact phrase "Aṣẹ."`;

const OGBE_GATE_BLOCKED_PATTERNS = [
  /\b(kill|murder|assassinate|bomb|terrorize|terrorise)\b/i,
  /\b(hurt|harm|attack|threaten)\s+(someone|somebody|him|her|them|people|person)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i,
];

function ensureAse(text, includeWhatsApp = false) {
  let cleaned = String(text || '').trim();
  if (!cleaned) cleaned = 'Please tell me what your business needs so I can recommend the right MercySoul service.';

  if (includeWhatsApp && !cleaned.includes(WHATSAPP_URL)) {
    cleaned = `${cleaned}\n\n${WHATSAPP_LINK}`;
  }

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
      'MercySoul Services',
      '• MercySoul Bot (Customer Assistant) — ₦150,000',
      '• MercySoul Build Flash (Website Generator) — ₦100,000',
      '• MercySoul Vision Brain (Custom Art) — ₦5,000 per image',
      '• MercySoul News Gate (Company Site) — ₦75,000',
      '• MercySoul Enterprise Framework — ₦750,000',
      '',
      'Tell me what your business needs and I will recommend the best option.',
      '',
      WHATSAPP_LINK,
    ].join('\n'));
  }

  if (upper === 'STATUS') return ensureAse('Please tell me what service you are interested in so I can help you with the next sales step.');
  if (upper.startsWith('STATUS ') || /^(ORDER\s*ID|ORDERID)\s*[:#-]?\s*\S+/i.test(normalized)) {
    return ensureAse(`For an order enquiry, please DM or WhatsApp the Founder with your service and order details.\n\n${WHATSAPP_LINK}`);
  }
  if (upper === 'TALK') return ensureAse(`Please contact the Founder, Anuoluwapo Adeoye, on WhatsApp to continue your purchase.\n\n${WHATSAPP_LINK}\n\nHuman support email: ${HUMAN_SUPPORT_EMAIL}.`);
  if (upper === 'HUMAN') return ensureAse(`Please contact the Founder, Anuoluwapo Adeoye, on WhatsApp to continue your purchase.\n\n${WHATSAPP_LINK}`);
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

  // GEMINI_API_KEY is the primary production secret. GOOGLE_API_KEY is accepted
  // as a compatibility fallback without exposing either credential to clients.
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

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!validateMessage(message)) return res.status(400).json({ reply: 'Please provide a message of 1–4000 characters. Aṣẹ.' });

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
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'x-goog-api-client': 'mercysoul/1.0',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiError = data?.error || {};
      const reason = Array.isArray(apiError.details)
        ? apiError.details.find((detail) => detail?.reason)?.reason
        : undefined;
      console.error('[MercySoul Security]', JSON.stringify({
        event: 'gemini_error',
        status: response.status,
        statusText: response.statusText,
        model: MODEL,
        requestId: context.requestId,
        ragLite: hasPdf,
        errorMessage: String(apiError.message || '').slice(0, 500),
        reason: reason || null,
        service: apiError.details?.find?.((detail) => detail?.metadata?.service)?.metadata?.service || null,
      }));
      const apiMessage = apiError.message || '';
      if (response.status === 400 && hasPdf) return res.status(502).json({ reply: ensureAse(`Gemini rejected the PDF input. ${apiMessage || 'Please try another PDF.'}`) });
      if (response.status === 401 || response.status === 403) return res.status(502).json({ reply: 'Gemini authentication or project access was rejected. Verify that the Vercel production GEMINI_API_KEY is the current Gemini API Auth key and that the key/project is authorized for the Gemini API. Aṣẹ.' });
      if (response.status === 404) return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Aṣẹ.` });
      if (response.status === 429) return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly. Aṣẹ.' });
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('').trim();
    if (!reply) return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Aṣẹ.' });
    return res.status(200).json({ reply: ensureAse(reply, true), ragLite: hasPdf });
  } catch (error) {
    console.error('[MercySoul Security]', JSON.stringify({ event: 'gemini_request_failed', requestId: context.requestId, ragLite: hasPdf, error: String(error?.message || error) }));
    return res.status(500).json({ reply: 'Connection error. Try again later. Aṣẹ.' });
  }
}
