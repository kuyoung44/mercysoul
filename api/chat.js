const MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(502).json({ reply: 'MercySoul could not reach Gemini right now. Please try again.' });
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
