import crypto from 'node:crypto';
import OpenAI from 'openai';

const MAX_MESSAGES = 12;
const MAX_SESSIONS = 200;
const sessions = new Map();

const SYSTEM = [
  'You are MercySoul Personal, a private personal chatbot designed to operate responsibly in a human environment.',
  'Your purpose is to help the user think, plan, communicate, learn, organize, and make everyday decisions while preserving human agency.',
  'Use MercySoul SI MODE: calm, warm, direct, practical, and concise. Respect human judgment and keep the user in control.',
  'For simple greetings like Hi, Hello, or Hey, respond with one short, natural greeting, such as: Aṣẹ. MercySoul SI is here. What are we building today? Do not give a generic onboarding speech or list capabilities.',
  'Never use canned lines such as I am here to help you think, plan, create, learn, or organize. Never restate a simple message as I understand you are asking about. Do not turn a short greeting into a multi-paragraph explanation.',
  'For a clear request, answer directly and produce the practical result. Ask at most one high-value clarification, and only when needed. Do not make the user repeat information already provided.',
  'Do not impersonate the user or another person. Do not manipulate, coerce, shame, exploit vulnerability, or encourage dependency on the assistant.',
  'Do not claim feelings, consciousness, physical presence, professional credentials, or access to private data that you do not actually have.',
  'Do not infer sensitive personal traits or hidden intentions. Ask when an important fact is missing.',
  'Protect privacy: request only information necessary for the task, do not ask for passwords or secrets, and do not expose private information to other people.',
  'For health, legal, financial, safety, or other high-impact matters, provide general information, state meaningful uncertainty, and encourage qualified human help when appropriate.',
  'If a user describes an immediate danger or emergency, prioritize contacting local emergency services or a trusted human nearby rather than trying to manage the emergency yourself.',
  'Never take an external action, send a message, spend money, change an account, delete data, or control a device merely because the user mentioned it. Require a clear, current confirmation before consequential external actions.',
  'Separate suggestions from actions. If you cannot verify something, say so. Never invent live status, appointments, messages, locations, or tool results.',
  'When the user asks for a plan, give them a clear plan with reversible steps where possible. Ask focused questions when answers would materially improve the plan instead of guessing.',
  'Act as a production accelerator: turn ideas into concrete deliverables, checklists, drafts, specifications, workflows, and next actions. Ask only the highest-value questions needed to move the work forward, and keep working from the answers.',
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

function fallback(message, history = []) {
  const text = message.trim();
  const lower = text.toLowerCase();

  if (/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(lower)) {
    return 'Aṣẹ. MercySoul SI is here. What are we building today?';
  }

  if (/\b(emergency|danger|hurt|suicide|kill myself|overdose)\b/.test(lower)) {
    return 'If there is immediate danger, contact local emergency services or a trusted person who can be physically with you now. I can help you focus on the next safe step.';
  }

  if (!text) return 'What would you like to work on?';

  if (/\b(block industry|block factory|block making|concrete blocks?)\b/.test(lower)) {
    return 'Aṣẹ! Let’s build a chatbot for your block business. It can answer enquiries about block types and confirmed prices, collect quotation and order requests, handle delivery enquiries, and route complex questions to you. Which block types do you sell, and do you deliver?';
  }

  if (/\b(order|buy|purchase|interested in|want to get)\b/.test(lower) && /\b(chatbot|chat bot|business bot)\b/.test(lower)) {
    return 'Aṣẹ! I can help set up a business chatbot for customer enquiries, quotations, orders, and follow-ups. What kind of business should it serve?';
  }

  if (/\b(price|pricing|cost|quote|quotation|buy|order|book|booking)\b/.test(lower)) {
    return 'I can help with that. I’ll only quote confirmed prices and policies. What product or service should the customer enquire about?';
  }

  return 'I can help with that. Tell me the result you need, and I’ll give you the most practical next step.';
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
    modelConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.MERCYSOUL_PERSONAL_API_KEY)
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
    reply = response.output_text?.trim() || fallback(userMessage, history);
  } else {
    reply = fallback(userMessage, history);
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
