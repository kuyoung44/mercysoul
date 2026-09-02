const GEMINI_UPLOAD_START = 'https://generativelanguage.googleapis.com/upload/v1beta/files';
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export const RAG_LITE_SYSTEM_PROMPT = `You are the MercySoul RAG-lite document assistant.
Answer questions ONLY from the uploaded PDF document supplied with the request.
Do not use general knowledge, memory, assumptions, or information outside the PDF.
If the PDF does not contain the answer, say clearly: "I couldn't find that information in the uploaded PDF."
Do not invent facts, citations, names, numbers, dates, or conclusions.
Keep answers concise and grounded in the document.`;

export async function uploadPdfToGemini({ buffer, displayName = 'mercysoul-document.pdf', apiKey }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('A PDF file is required.');
  if (buffer.length > MAX_PDF_BYTES) throw new Error('PDF exceeds the 50 MB limit.');

  const safeName = String(displayName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document.pdf';
  const startResponse = await fetch(GEMINI_UPLOAD_START, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(buffer.length),
      'X-Goog-Upload-Header-Content-Type': 'application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: safeName } }),
  });

  if (!startResponse.ok) {
    const detail = await startResponse.text().catch(() => '');
    throw new Error(`Gemini PDF upload initialization failed (${startResponse.status}): ${detail.slice(0, 500)}`);
  }

  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('Gemini did not return an upload URL.');

  const finalizeResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(buffer.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Type': 'application/pdf',
    },
    body: buffer,
  });

  const fileInfo = await finalizeResponse.json().catch(() => ({}));
  if (!finalizeResponse.ok || !fileInfo?.file?.uri) {
    throw new Error(`Gemini PDF upload failed (${finalizeResponse.status}).`);
  }

  return {
    name: fileInfo.file.name,
    uri: fileInfo.file.uri,
    mimeType: fileInfo.file.mimeType || 'application/pdf',
    displayName: fileInfo.file.displayName || safeName,
  };
}

export function isValidGeminiFileUri(uri) {
  return typeof uri === 'string' && /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/files\//.test(uri);
}
