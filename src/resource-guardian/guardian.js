import crypto from 'node:crypto';

const DEFAULTS = Object.freeze({
  enabled: true,
  maxInputTokens: 12000,
  maxOutputTokens: 1200,
  maxRequestTokens: 14000,
  maxDailyTokens: 250000,
  cacheTtlMs: 60000,
  cacheMaxEntries: 200,
  allowedModels: [],
  defaultModel: '',
});

const SENSITIVE = [
  /\\b(api[_ -]?key|secret|password|passwd|bearer|private[_ -]?key)\\b\\s*[:=]\\s*\\S+/i,
  /\\bsk-[A-Za-z0-9_-]{12,}\\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
];
const PRIVATE_MARKERS = /<private>[\\s\\S]*?<\\/private>/i;
const cache = new Map();
const usageByDay = new Map();

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const estimateTokens = (text) => Math.max(1, Math.ceil(String(text || '').length / 4));
const hasSensitiveMaterial = (text) => SENSITIVE.some((pattern) => pattern.test(String(text || '')));

function cleanModelList(value) {
  return Array.isArray(value) ? [...new Set(value.map(String).map((v) => v.trim()).filter(Boolean))] : [];
}

export function guardianConfig(overrides = {}) {
  return Object.freeze({
    ...DEFAULTS,
    ...overrides,
    allowedModels: cleanModelList(overrides.allowedModels ?? DEFAULTS.allowedModels),
  });
}

export function deterministicResult(input = {}) {
  const operation = String(input.operation || '').trim().toLowerCase();
  const args = input.args || {};
  if (operation === 'sum' && Array.isArray(args.values) && args.values.length <= 100 && args.values.every(Number.isFinite)) {
    return { handled: true, result: args.values.reduce((a, b) => a + b, 0), operation };
  }
  if (operation === 'format-json' && args.value !== undefined) {
    return { handled: true, result: JSON.stringify(args.value), operation };
  }
  return { handled: false, reason: 'no_registered_deterministic_handler' };
}

function cacheKey({ tenantId, userId, projectId, model, prompt, systemVersion }) {
  return crypto.createHash('sha256').update(JSON.stringify({
    tenantId: tenantId || 'default',
    userId,
    projectId: projectId || null,
    model,
    prompt,
    systemVersion: systemVersion || '1',
  })).digest('hex');
}

export function readSafeCache(key, now = Date.now()) {
  const item = cache.get(key);
  if (!item) return { hit: false };
  if (item.expiresAt <= now) {
    cache.delete(key);
    return { hit: false, reason: 'expired' };
  }
  cache.delete(key);
  cache.set(key, item);
  return { hit: true, value: item.value };
}

export function writeSafeCache(key, value, config = {}, now = Date.now()) {
  const ttl = Math.max(0, Number(config.cacheTtlMs ?? DEFAULTS.cacheTtlMs));
  const max = Math.max(0, Number(config.cacheMaxEntries ?? DEFAULTS.cacheMaxEntries));
  if (!ttl || !max) return false;
  cache.delete(key);
  cache.set(key, { value, expiresAt: now + ttl });
  while (cache.size > max) cache.delete(cache.keys().next().value);
  return true;
}

export function selectModel({ requestedModel, config = {} } = {}) {
  const cfg = guardianConfig(config);
  const candidate = String(requestedModel || cfg.defaultModel || '').trim();
  if (!candidate) return { ok: false, reason: 'no_model_configured' };
  if (cfg.allowedModels.length && !cfg.allowedModels.includes(candidate)) {
    return { ok: false, reason: 'model_not_allowlisted' };
  }
  return { ok: true, model: candidate };
}

export function checkBudget({ prompt, maxOutputTokens, usageToday = 0, config = {} } = {}) {
  const cfg = guardianConfig(config);
  const inputTokens = estimateTokens(prompt);
  const outputTokens = Math.max(1, Number(maxOutputTokens || cfg.maxOutputTokens));
  const requestTokens = inputTokens + outputTokens;
  const reasons = [];
  if (inputTokens > cfg.maxInputTokens) reasons.push('input_token_limit_exceeded');
  if (outputTokens > cfg.maxOutputTokens) reasons.push('output_token_limit_exceeded');
  if (requestTokens > cfg.maxRequestTokens) reasons.push('request_token_limit_exceeded');
  if (Number(usageToday || 0) + requestTokens > cfg.maxDailyTokens) reasons.push('daily_token_budget_exceeded');
  return { allowed: reasons.length === 0, inputTokens, outputTokens, estimatedRequestTokens: requestTokens, reasons };
}

export function recordUsage({ userId = 'system', inputTokens = 0, outputTokens = 0, date = new Date() } = {}) {
  const key = `${dayKey(date)}:${userId}`;
  const current = usageByDay.get(key) || { inputTokens: 0, outputTokens: 0, requests: 0 };
  const next = {
    inputTokens: current.inputTokens + Math.max(0, Number(inputTokens) || 0),
    outputTokens: current.outputTokens + Math.max(0, Number(outputTokens) || 0),
    requests: current.requests + 1,
  };
  usageByDay.set(key, next);
  return { ...next, totalTokens: next.inputTokens + next.outputTokens };
}

export function getUsage({ userId = 'system', date = new Date() } = {}) {
  const value = usageByDay.get(`${dayKey(date)}:${userId}`) || { inputTokens: 0, outputTokens: 0, requests: 0 };
  return { ...value, totalTokens: value.inputTokens + value.outputTokens };
}

export async function runGuardedRequest(input = {}, adapters = {}) {
  const requestId = input.requestId || crypto.randomUUID();
  const cfg = guardianConfig(input.config || {});
  const userId = String(input.authenticatedUserId || '').trim();
  if (!cfg.enabled) return { ok: false, requestId, status: 'paused', reason: 'guardian_disabled' };
  if (!userId) return { ok: false, requestId, status: 'blocked', reason: 'authenticated_user_required' };

  const local = deterministicResult(input);
  if (local.handled) {
    return { ok: true, requestId, route: 'local', result: local.result, usage: { aiCalls: 0, tokens: 0 } };
  }

  const prompt = String(input.prompt || '').trim();
  if (!prompt) return { ok: false, requestId, status: 'blocked', reason: 'prompt_required' };
  const privateContent = input.private === true || PRIVATE_MARKERS.test(prompt) || hasSensitiveMaterial(prompt);
  const modelChoice = selectModel({ requestedModel: input.requestedModel, config: cfg });
  if (!modelChoice.ok) return { ok: false, requestId, status: 'blocked', reason: modelChoice.reason };

  const usage = getUsage({ userId });
  const budget = checkBudget({ prompt, maxOutputTokens: input.maxOutputTokens, usageToday: usage.totalTokens, config: cfg });
  if (!budget.allowed) {
    return { ok: false, requestId, status: 'approval_required', reason: 'budget_limit', budget, executionPerformed: false };
  }

  const canCache = input.cache === true
    && input.cacheClass === 'public'
    && !privateContent
    && Boolean(input.projectId);
  let key;
  if (canCache) {
    key = cacheKey({
      tenantId: input.tenantId,
      userId,
      projectId: input.projectId,
      model: modelChoice.model,
      prompt,
      systemVersion: input.systemVersion,
    });
    const hit = readSafeCache(key);
    if (hit.hit) return { ok: true, requestId, route: 'cache', result: hit.value, usage: { aiCalls: 0, tokens: 0 } };
  }

  if (input.requiresExternalAction === true) {
    return {
      ok: false,
      requestId,
      status: 'approval_required',
      reason: 'consequential_action_requires_human_approval',
      executionPerformed: false,
    };
  }
  if (typeof adapters.generate !== 'function') {
    return { ok: false, requestId, status: 'unavailable', reason: 'model_adapter_not_provided' };
  }

  const generated = await adapters.generate({
    model: modelChoice.model,
    prompt,
    maxOutputTokens: budget.outputTokens,
    requestId,
  });
  const actualInput = Number(generated?.usage?.inputTokens ?? generated?.usage?.promptTokens ?? budget.inputTokens);
  const actualOutput = Number(generated?.usage?.outputTokens ?? generated?.usage?.completionTokens ?? 0);
  const recorded = recordUsage({ userId, inputTokens: actualInput, outputTokens: actualOutput });
  if (canCache && typeof generated?.text === 'string' && generated.cacheSafe === true) {
    writeSafeCache(key, generated.text, cfg);
  }
  if (typeof adapters.audit === 'function') {
    await adapters.audit({
      eventType: 'resource_guardian_usage',
      requestId,
      payload: {
        userId,
        model: modelChoice.model,
        inputTokens: actualInput,
        outputTokens: actualOutput,
        totalTokens: recorded.totalTokens,
        cacheEligible: canCache,
      },
    });
  }
  return {
    ok: true,
    requestId,
    route: 'model',
    model: modelChoice.model,
    result: generated?.text ?? generated,
    usage: {
      aiCalls: 1,
      inputTokens: actualInput,
      outputTokens: actualOutput,
      dailyTotalTokens: recorded.totalTokens,
    },
  };
}

export function resourceGuardianStatus() {
  return {
    name: 'MercySoul Resource Guardian',
    version: '1.0.0',
    enabled: true,
    policyOnly: true,
    localHandlers: ['sum', 'format-json'],
    cache: 'bounded-ephemeral-owner-and-project-scoped',
    budgetUnit: 'tokens',
    exactCurrencyCost: 'not_available_without_provider_pricing_adapter',
    approvalRequiredForConsequentialActions: true,
    credentialsExposed: false,
  };
}

export function resetGuardianStateForTests() {
  cache.clear();
  usageByDay.clear();
}
