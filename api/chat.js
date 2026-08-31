const configuredModel = process.env.GEMINI_MODEL?.trim();
const MODEL = configuredModel || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are the MercySoul Dominion Sales Assistant, the official sales assistant for MercySoul.

Your purpose is to sell and explain MercySoul's digital creative and AI services.

Services and fixed prices:
- Custom digital talisman: ₦5,000 each.
- Custom wallpaper: ₦5,000 each.
- Custom AI chatbot for businesses: ₦50,000.

When people ask about MercySoul services or prices, quote these prices confidently and clearly. Do not invent discounts, alternative prices, guarantees, delivery dates, or additional services.

For orders and serious enquiries, direct clients to contact the Founder, Anuoluwapo, directly via WhatsApp or Facebook to place an order. Do not invent a WhatsApp number, Facebook URL, or other contact details that have not been provided by the system.

Be warm, concise, professional, confident, and sales-focused. Explain the value of the service and ask a brief qualifying question when useful. Never claim an order or payment has been completed unless the system explicitly confirms it.

Every response MUST end with the exact phrase "Aṣẹ."`;

function ensureAse(text) {
  const cleaned = String(text || '').trim();
  if (!cleaned) return 'Please contact Founder Anuoluwapo via WhatsApp or Facebook to place your order. Aṣẹ.';
  return /Aṣẹ\.$/.test(cleaned) ? cleaned : `${cleaned.replace(/Aṣẹ\.?$/i, '').trim()} Aṣẹ.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed. Aṣẹ.' });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ reply: 'MercySoul chat is not configured: GEMINI_API_KEY is missing. Aṣẹ.' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) {
    return res.status(400).json({ reply: 'Please provide a message. Aṣẹ.' });
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
        return res.status(502).json({ reply: 'Gemini authentication failed. Check the GEMINI_API_KEY configured in Vercel. Aṣẹ.' });
      }
      if (response.status === 404) {
        return res.status(502).json({ reply: `Gemini model '${MODEL}' is unavailable. Set GEMINI_MODEL to an active Gemini model in Vercel. Aṣẹ.` });
      }
      if (response.status === 429) {
        return res.status(502).json({ reply: 'Gemini rate limit reached. Please try again shortly. Aṣẹ.' });
      }
      return res.status(502).json({ reply: ensureAse(apiMessage || 'MercySoul could not reach Gemini right now. Please try again.') });
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || '')
      .join('')
      .trim();

    if (!reply) {
      return res.status(502).json({ reply: 'Gemini returned no text response. Please try again. Aṣẹ.' });
    }

    return res.status(200).json({ reply: ensureAse(reply) });
  } catch (error) {
    console.error('Gemini request failed:', error);
    return res.status(500).json({ reply: 'Connection error. Try again later. Aṣẹ.' });
  }
}
