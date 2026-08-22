import express from 'express';
import helmet from 'helmet';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req,res) => res.send('MercySoul OS LIVE - v2.4.1 - Gemini 2.5'));

// This is the verify endpoint that was giving 404
app.post('/api/verify', async (req,res) => {
  try {
    const prompt = req.body.prompt || "I'm floating in the air";
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    res.json({ success: true, text: result.text });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message, model: 'gemini-2.5-flash' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('LIVE on', PORT));
