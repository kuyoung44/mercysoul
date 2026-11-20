import crypto from 'node:crypto';
import { runMercySoulAI, mercySoulAiStatus } from '../ai/mercy-soul-ai.js';

const MAX_PROMPT_LENGTH = 4000;
const INTENT_RULES = [
  { intent: 'software_build', pattern: /\b(build|code|debug|deploy|website|app|api|software|database|github|vercel)\b/i },
  { intent: 'business_growth', pattern: /\b(business|client|customer|sales|revenue|marketing|sponsor|funding|pricing)\b/i },
  { intent: 'creative_work', pattern: /\b(design|art|image|brand|logo|story|write|create|music|fashion)\b/i },
  { intent: 'research', pattern: /\b(research|compare|investigate|find|source|evidence|analyze)\b/i },
];
const CONSEQUENTIAL_ACTION = /\b(send|publish|post|deploy|purchase|buy|pay|transfer|delete|remove|overwrite|migrate|grant|revoke|message|email|book|submit)\b/i;

export function classifyVisionIntent(value = '') {
  const text = String(value).trim();
  return INTENT_RULES.find((rule) => rule.pattern.test(text))?.intent || 'general_assistance';
}

export function createVisionPlan(value = '') {
  const prompt = String(value).trim();
  const intent = classifyVisionIntent(prompt);
  const approvalRequired = CONSEQUENTIAL_ACTION.test(prompt);
  return {
    intent,
    objective: prompt,
    stages: [
      { stage: 'RECEIVE', status: 'complete' },
      { stage: 'ROUTE', status: 'complete', route: intent },
      { stage: 'THINK', status: 'ready' },
      { stage: 'PLAN', status: 'ready' },
      { stage: 'GUARDIAN', status: approvalRequired ? 'approval_required' : 'guarded' },
      { stage: 'APPROVE', status: approvalRequired ? 'awaiting_human' : 'not_required_for_response_only' },
      { stage: 'EXECUTE', status: 'disabled_in_v1' },
      { stage: 'VERIFY', status: 'pending' },
      { stage: 'RECOVER', status: 'available_on_failure' },
      { stage: 'RECORD', status: 'metadata_only' },
    ],
    approvalRequired,
    executionAllowed: false,
    externalMutation: false,
  };
}

export function visionBrainStatus() {
  const ai = mercySoulAiStatus();
  return {
    name: 'MercySoul Vision Brain',
    version: '1.0.0',
    available: true,
    modelConfigured: ai.model !== 'not-configured',
    model: ai.model,
    mode: ai.model === 'not-configured' ? 'planning_only' : 'guarded_ai',
    capabilities: ['intent_routing', 'structured_planning', 'governance_gate', 'model_response'],
    execution: 'response_only',
    externalMutation: false,
  };
}

export async function runVisionBrainTurn(input = {}, options = {}) {
  const prompt = String(input.prompt ?? input.message ?? input.text ?? '').trim();
  const requestId = options.requestId || crypto.randomUUID();
  if (!prompt) return { ok: false, requestId, decision: 'review', error: 'A prompt is required.' };
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return { ok: false, requestId, decision: 'review', error: 'Prompt must be 4000 characters or fewer.' };
  }

  const plan = createVisionPlan(prompt);
  const generated = await runMercySoulAI({ message: prompt }, { requestId });
  const stages = plan.stages.map((item) => {
    if (item.stage === 'THINK' || item.stage === 'PLAN') {
      return { ...item, status: generated.ok ? 'complete' : 'blocked' };
    }
    if (item.stage === 'VERIFY') return { ...item, status: generated.ok ? 'complete' : 'not_verified' };
    return item;
  });

  return {
    ok: generated.ok,
    requestId,
    decision: plan.approvalRequired ? 'review' : generated.decision,
    intent: plan.intent,
    response: generated.response || null,
    error: generated.error || null,
    plan: { ...plan, stages },
    governance: {
      humanJudgmentRequired: true,
      approvalRequired: plan.approvalRequired,
      executionAllowed: false,
      externalMutation: false,
      modelConfigured: visionBrainStatus().modelConfigured,
    },
  };
}
