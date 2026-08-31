const configuredModel = process.env.GEMINI_MODEL?.trim();
// Use an active model by default. If Vercel still has a stale/deprecated
// GEMINI_MODEL value, fall back instead of sending requests to an unavailable model.
const MODEL = configuredModel || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing.' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        model: MODEL,
        error: data?.error?.message || data,
      });

      const apiMessage = data?.error?.message || '';
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({ reply: 'Gemini authentication failed. Check the GEMINI_API_KEY configured in Vercel.' });
      }
      if (response.status === 404) {
        return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel.` });
      }
      if (response.status === 429) {
        return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly.' });
      }
      return res.status(502).json({ reply: apiMessage || 'MercySoul could not reach Gemini right now. Please try again.' });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({ reply: 'Gemini returned no text response. Please try again.' });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Gemini request failed:', error);
    return res.status(500).json({ reply: 'Connection error. Try again later.' });
  }
}
