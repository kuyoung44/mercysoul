import multer from 'multer';
import { securityHeaders, validateChatRequest, validateOrigin } from '../src/api-security.js';
import { uploadPdfToGemini } from '../src/rag-lite.js';

export const config = { api: { bodyParser: false } };
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

function runUpload(req, res) {
  return new Promise((resolve, reject) => upload.single('file')(req, res, (error) => error ? reject(error) : resolve()));
}

export default async function handler(req, res) {
  securityHeaders(res);
  const context = validateChatRequest(req);
  res.setHeader('x-request-id', context.requestId);
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  if (!context.allowed) { res.setHeader('Retry-After', String(context.retryAfter || 10)); return res.status(429).json({ ok: false, error: 'Too many requests. Please try again shortly.' }); }
  if (!validateOrigin(req)) return res.status(403).json({ ok: false, error: 'Request origin is not authorized.' });
  if (!process.env.GEMINI_API_KEY?.trim()) return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY is missing.' });

  try {
    await runUpload(req, res);
    if (!req.file) return res.status(400).json({ ok: false, error: 'Upload a PDF in the multipart field named "file".' });
    if (req.file.mimetype !== 'application/pdf') return res.status(415).json({ ok: false, error: 'Only PDF files are accepted.' });
    const document = await uploadPdfToGemini({ buffer: req.file.buffer, displayName: req.file.originalname, apiKey: process.env.GEMINI_API_KEY.trim() });
    return res.status(201).json({ ok: true, document, message: 'PDF uploaded. Use document.uri with /api/chat to ask questions grounded only in this PDF.' });
  } catch (error) {
    const message = String(error?.message || error);
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ ok: false, error: 'PDF exceeds the 50 MB limit.' });
    if (/Unexpected field|File too large|LIMIT_UNEXPECTED_FILE/i.test(message)) return res.status(400).json({ ok: false, error: 'Upload exactly one PDF using the multipart field named "file".' });
    console.error('[MercySoul RAG-lite Upload]', JSON.stringify({ requestId: context.requestId, error: message.slice(0, 500) }));
    return res.status(502).json({ ok: false, error: 'Unable to upload the PDF to Gemini.' });
  }
}
