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
  const text = message.toLowerCase();

  if (/\b(hello|hi|hey)\b/.test(text)) {
    return 'Hello. I am here to help you think, plan, create, or organize—while keeping you in control. What would you like to work on?';
  }

  if (/\b(what'?s|what is|tell me about|explain|describe|how does)\b/.test(text) && /\b(mercy\s*soul\s*vision\s*brain|vision\s*brain)\b/.test(text)) {
    return 'MercySoul Vision Brain is MercySoul’s creative intelligence layer: it turns ideas, descriptions, and creative direction into useful visual and creative outputs. In the MercySoul ecosystem, Vision Brain is positioned around imagination, creation, and production—not just conversation. If you want, I can explain its purpose, how it fits with MercySoul OS, or how to turn it into a product/business.';
  }

  if (/\b(emergency|danger|hurt|suicide|kill myself|overdose)\b/.test(text)) {
    return 'If there is immediate danger, please contact local emergency services or a trusted person who can be physically with you now. I can stay focused with you while you take that step.';
  }

  if (/\b(organize|structure|restructure|systematize)\b/.test(text) && /\b(business|company|brand|work|enterprise|business layer)\b/.test(text)) {
    return 'Absolutely. Let’s organize your business layer into a clear operating structure. Start with these five parts: 1) Business identity and offer, 2) Products/services and pricing, 3) Customers and sales, 4) Operations and delivery, 5) Finance and growth. Tell me what your business currently sells and I’ll turn it into a clean structure with priorities and next steps.';
  }

  if (/\b(coconut|coconuts)\b/.test(text) && /\b(profit|profits|profitable|money|income|sell|selling|business|products|product)\b/.test(text)) {
    return 'Yes. Coconut can be turned into several product businesses, but the profit comes from choosing the right product, controlling input costs, and finding buyers before scaling. A practical starting map is: 1) Coconut oil, 2) Coconut chips/snacks, 3) Coconut milk/cream, 4) Coconut flour, 5) Coconut shell/fiber products. Let’s compare them by startup cost, selling price, processing difficulty, shelf life, and target customers. Tell me your starting budget and whether you want to sell locally, online, or to businesses, and I’ll build a simple profit plan.';
  }

  if (/\b(business|company|brand|enterprise)\b/.test(text)) {
    return 'Yes. I can act as your production accelerator for the business: turn ideas into offers, product specs, pricing drafts, sales copy, workflows, checklists, and launch steps. I’ll ask focused questions when I need information, then produce the next usable output.';
  }

  if (/\b(plan|planning|roadmap|strategy|goal|goals)\b/.test(text)) {
    return 'Let’s turn that into a practical plan. Give me the outcome you want, your current situation, and any deadline or constraint. I’ll separate priorities, actions, and decisions.';
  }

  if (/\b(write|writing|draft|email|message|caption|document)\b/.test(text)) {
    return 'I can draft or improve it. Send me the rough idea or existing text, tell me who it is for, and I’ll turn it into usable copy.';
  }

  if (/\b(learn|study|understand|teach|explain)\b/.test(text)) {
    return 'Absolutely. Tell me the subject and your current level, and I’ll explain it clearly and build from there.';
  }

  if (/\b(problem|issue|stuck|fix|solve|solution)\b/.test(text)) {
    return 'Let’s solve it methodically: define the problem, verify what is actually happening, identify the smallest useful fix, then test the result. Tell me what is going wrong.';
  }

  return 'What are you trying to produce or accomplish? Give me the goal, what you already have, and any deadline. I’ll ask only the questions that matter, then help produce the next usable result.';
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
