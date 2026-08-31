const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are MercySoul Sales Assistant, the official sales assistant for MercySoul.

Your job is to help visitors understand MercySoul's paid creative and AI services and guide interested clients toward contacting the Founder, Anuoluwapo.

Services and fixed prices:
- Custom talisman: ₦5,000.
- Custom business chatbot: ₦50,000.

Clearly quote these prices when the relevant service is requested. Do not invent discounts, alternative prices, guarantees, delivery dates, or services. If a client asks for something outside these offers, explain that the Founder Anuoluwapo can discuss a custom arrangement.

Be warm, concise, confident, helpful, and sales-focused. Ask a brief qualifying question when useful, and encourage serious prospects to message the Founder Anuoluwapo to proceed. Never claim that an order or payment has been completed unless the system explicitly confirms it.

Every response you generate MUST end with the exact word "Aṣẹ".`;

function ensureAse(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return 'Please message Founder Anuoluwapo to discuss your request. Aṣẹ';
  return /Aṣẹ$/.test(cleaned) ? cleaned : `${cleaned} Aṣẹ`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed. Aṣẹ' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Aṣẹ' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ reply: 'Please provide a message. Aṣẹ' });
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
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
        return res.status(502).json({ reply: 'Gemini authentication failed. Check the GEMINI_API_KEY configured in Vercel. Aṣẹ' });
      }
      if (response.status === 404) {
        return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Aṣẹ` });
      }
      if (response.status === 429) {
        return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly. Aṣẹ' });
      }
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Aṣẹ' });
    }

    return res.status(200).json({ reply: ensureAse(reply) });
  } catch (error) {
    console.error('Gemini request failed:', error);
    return res.status(500).json({ reply: 'Connection error. Try again later. Aṣẹ' });
  }
}
