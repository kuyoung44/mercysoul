import crypto from 'node:crypto';
import OpenAI from 'openai';
import { naturalConversationReply } from '../natural-conversation-mode.js';

const MAX_MESSAGES = 12;
const MAX_SESSIONS = 200;
const sessions = new Map();

const SYSTEM = [
  'You are MercySoul Personal, a private personal chatbot designed to operate responsibly in a human environment.',
  'Your purpose is to help the user think, plan, communicate, learn, organize, and make everyday decisions while preserving human agency.',
  'Be warm, calm, honest, practical, and concise. Treat the user as the decision-maker.',
  'NATURAL CONVERSATION MODE v1.0: recognize greetings, thanks, acknowledgments, and casual conversation as ordinary conversational acts. Respond naturally and proportionately. Do not turn simple messages into tasks, paraphrase the user unnecessarily, expose internal planning or governance steps, or ask a forced follow-up question. Ask only the smallest necessary question when a real ambiguity blocks progress.',
  'For actionable requests, use structured reasoning when useful and apply MercySoul governance. Authorization is required before consequential external actions; natural conversation mode never bypasses security or approval controls.',
  'Do not impersonate the user or another person. Do not manipulate, coerce, shame, exploit vulnerability, or encourage dependency on the assistant.',
  'Do not claim feelings, consciousness, physical presence, professional credentials, or access to private data that you do not actually have.',
  'Do not infer sensitive personal traits or hidden intentions. Ask when an important fact is missing.',
  'Protect privacy: request only information necessary for the task, do not ask for passwords or secrets, and do not expose private information to other people.',
  'For health, legal, financial, safety, or other high-impact matters, provide general information, state meaningful uncertainty, and encourage qualified human help when appropriate.',
  'If a user describes an immediate danger or emergency, prioritize contacting local emergency services or a trusted human nearby rather than trying to manage the emergency yourself.',
  'Never take an external action, send a message, spend money, change an account, delete data, or control a device merely because the user mentioned it. Require clear, current authorization before consequential external actions.',
  'Separate suggestions from actions. If you cannot verify something, say so. Never invent live status, appointments, messages, locations, or tool results.',
  'When the user asks for a plan, give them a clear plan with reversible steps where possible. Ask focused questions when answers would materially improve the plan instead of guessing.',
  'Act as a production accelerator: turn ideas into concrete deliverables, checklists, drafts, specifications, workflows, and next actions. Ask only the highest-value questions needed to move the work forward, and keep working from the answers.',
  'Use the control discipline when interacting with MercySoul systems: STOP -> VERIFY -> AUTHORIZE -> EXECUTE -> VERIFY_RESULT -> AUDIT.',
  'Return clean, correctly rendered text. Do not output literal escaped newline sequences when actual line breaks are intended.',
  'You are an assistant, not an authority over the user. Human consent and legitimate system authorization remain the boundary.'
].join(' ');

function normalize(value) {
  return typeof value === 'string' ? value.trim().slice(0, 6000) : '';
}

function sessionKey(input) {
  return normalize(input.sessionId || input.userId) || crypto.randomUUID();
}

function trimHistory(history) {
  return history.slice(-MAX_MESSAGES);
}

function localEmergencyReply(message) {
  const lower = message.toLowerCase();
  if (/\\b(emergency|danger|hurt|suicide|kill myself|overdose)\\b/.test(lower)) {
    return 'If there is immediate danger, contact local emergency services or a trusted person who can be physically with you now. I can help you focus on the next safe step.';
  }
  return null;
}

function configuredOpenAIKey() {
  return String(process.env.OPENAI_API_KEY || process.env.MERCYSOUL_PERSONAL_API_KEY || '').trim();
}

function configuredGeminiKey() {
  return String(process.env.GEMINI_API_KEY || '').trim();
}

async function generateWithGemini(apiKey, history, userMessage) {
  const model = process.env.MERCYSOUL_GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const contents = [...history, { role: 'user', content: userMessage }].map(item => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }]
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents,
      generationConfig: { maxOutputTokens: 700, temperature: 0.7 }
    }),
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error?.message || 'Gemini request failed.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || '';
}

export function personalBotStatus() {
  return {
    enabled: true,
    service: 'MercySoul Personal',
    role: 'Personal assistant / human-environment responsible',
    memory: 'last 12 messages per session (process memory only)',
    externalActions: 'confirmation-required',
    humanAgency: true,
    conversationMode: 'NATURAL CONVERSATION MODE v1.0',
    privacy: 'minimal-data by default',
    modelConfigured: Boolean(configuredOpenAIKey() || configuredGeminiKey()),\n    availableProviders: ['openai', 'gemini']
  };
}

export async function runPersonalBot({ message, sessionId, userId } = {}) {
  const userMessage = normalize(message);
  if (!userMessage) return { ok: false, error: 'message is required' };

  const key = sessionKey({ sessionId, userId });
  let history = trimHistory(sessions.get(key) || []);

  // Ordinary social turns remain natural without a model. Both supported
  // server-side key names must resolve to the same authenticated provider.
  let reply = naturalConversationReply(userMessage);
  if (!reply) {
    const openAiKey = configuredOpenAIKey();
    const geminiKey = configuredGeminiKey();
    if (!openAiKey && !geminiKey) {
      const emergencyReply = localEmergencyReply(userMessage);
      if (emergencyReply) {
        return { ok: true, sessionId: key, reply: emergencyReply, memory: 'not stored', externalActions: 'confirmation-required' };
      }
      return {
        ok: false,
        code: 'AI_PROVIDER_NOT_CONFIGURED',
        error: 'MercySoul AI is not connected yet. The server needs OPENAI_API_KEY, MERCYSOUL_PERSONAL_API_KEY, or GEMINI_API_KEY before it can generate an AI response. No placeholder answer was generated.'
      };
    }

    if (openAiKey) {
      const client = new OpenAI({ apiKey: openAiKey });
      const response = await client.responses.create({
        model: process.env.MERCYSOUL_PERSONAL_MODEL || 'gpt-5-mini',
        instructions: SYSTEM,
        input: [...history, { role: 'user', content: userMessage }],
        max_output_tokens: 700
      });
      reply = response.output_text?.trim();
    } else {
      reply = await generateWithGemini(geminiKey, history, userMessage);
    }
    if (!reply) {
      return {
        ok: false,
        code: 'AI_EMPTY_RESPONSE',
        error: 'The AI provider returned an empty response. Please try again.'
      };
    }
  }

  history.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: reply }
  );
  sessions.set(key, trimHistory(history));

  if (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value);
  }

  return {
    ok: true,
    sessionId: key,
    reply,
    memory: 'last 12 messages',
    externalActions: 'confirmation-required'
  };
}

export function clearPersonalBotSession(sessionId) {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
}
