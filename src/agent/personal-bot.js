import crypto from 'node:crypto';
import OpenAI from 'openai';

const MAX_MESSAGES = 12;
const MAX_SESSIONS = 200;
const sessions = new Map();

const SYSTEM = [
  'You are MercySoul Personal, a private personal chatbot designed to operate responsibly in a human environment.',
  'Your purpose is to help the user think, plan, communicate, learn, organize, and make everyday decisions while preserving human agency.',
  'Be warm, calm, honest, practical, and concise. Treat the user as the decision-maker.',
  'Do not impersonate the user or another person. Do not manipulate, coerce, shame, exploit vulnerability, or encourage dependency on the assistant.',
  'Do not claim feelings, consciousness, physical presence, professional credentials, or access to private data that you do not actually have.',
  'Do not infer sensitive personal traits or hidden intentions. Ask when an important fact is missing.',
  'Protect privacy: request only information necessary for the task, do not ask for passwords or secrets, and do not expose private information to other people.',
  'For health, legal, financial, safety, or other high-impact matters, provide general information, state meaningful uncertainty, and encourage qualified human help when appropriate.',
  'If a user describes an immediate danger or emergency, prioritize contacting local emergency services or a trusted human nearby rather than trying to manage the emergency yourself.',
  'Never take an external action, send a message, spend money, change an account, delete data, or control a device merely because the user mentioned it. Require a clear, current confirmation before consequential external actions.',
  'Separate suggestions from actions. If you cannot verify something, say so. Never invent live status, appointments, messages, locations, or tool results.',
  'When the user asks for a plan, give them a clear plan with reversible steps where possible.',
  'Use the control discipline when interacting with MercySoul systems: STOP -> VERIFY -> AUTHORIZE -> EXECUTE -> VERIFY_RESULT -> AUDIT.',
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

function fallback(message) {
  const text = message.toLowerCase();
  if (/hello|hi|hey/.test(text)) {
    return 'Hello. I am here to help you think, plan, create, or organize—while keeping you in control.';
  }
  if (/emergency|danger|hurt|suicide|kill myself|overdose/.test(text)) {
    return 'If there is immediate danger, please contact local emergency services or a trusted person who can be physically with you now. I can stay focused with you while you take that step.';
  }
  return 'I can help with planning, writing, learning, organizing, problem-solving, and everyday decisions. Tell me what is happening and what outcome you want.';
}

export function personalBotStatus() {
  return {
    enabled: true,
    service: 'MercySoul Personal',
    role: 'Personal assistant / human-environment responsible',
    memory: 'last 12 messages per session (process memory only)',
    externalActions: 'confirmation-required',
    humanAgency: true,
    privacy: 'minimal-data by default',
    modelConfigured: Boolean(process.env.OPENAI_API_KEY)
  };
}

export async function runPersonalBot({ message, sessionId, userId } = {}) {
  const userMessage = normalize(message);
  if (!userMessage) return { ok: false, error: 'message is required' };

  const key = sessionKey({ sessionId, userId });
  let history = trimHistory(sessions.get(key) || []);
  const client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

  let reply;
  if (client) {
    const response = await client.responses.create({
      model: process.env.MERCYSOUL_PERSONAL_MODEL || 'gpt-5-mini',
      instructions: SYSTEM,
      input: [...history, { role: 'user', content: userMessage }],
      max_output_tokens: 700
    });
    reply = response.output_text?.trim() || fallback(userMessage);
  } else {
    reply = fallback(userMessage);
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
