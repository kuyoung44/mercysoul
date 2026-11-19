const TASK_CLASSES = new Set(['general', 'fast', 'reasoning', 'coding', 'creative', 'research']);

const clean = (value) => typeof value === 'string' ? value.trim() : '';

function configuredModels(env = process.env) {
  const primary = clean(env.MERCYSOUL_MODEL_PRIMARY) ||
    clean(env.MERCYSOUL_AI_MODEL) ||
    clean(env.GEMINI_MODEL);

  return {
    primary,
    fast: clean(env.MERCYSOUL_MODEL_FAST) || primary,
    reasoning: clean(env.MERCYSOUL_MODEL_REASONING) || primary,
    coding: clean(env.MERCYSOUL_MODEL_CODING) || primary,
    creative: clean(env.MERCYSOUL_MODEL_CREATIVE) || primary,
    research: clean(env.MERCYSOUL_MODEL_RESEARCH) || primary,
    fallback: clean(env.MERCYSOUL_MODEL_FALLBACK),
  };
}

/**
 * Selects a model identifier for the existing AI SDK / Vercel AI Gateway path.
 * This module never calls a provider, retries a request, or executes a tool.
 */
export function selectMercySoulModel({ task = 'general', requestedModel = '', env = process.env } = {}) {
  const models = configuredModels(env);
  const normalizedTask = TASK_CLASSES.has(task) ? task : 'general';
  const requested = clean(requestedModel);

  const model = requested || models[normalizedTask] || models.primary;
  if (!model) {
    return {
      ok: false,
      decision: 'review',
      error: 'No model is configured. Set MERCYSOUL_MODEL_PRIMARY or GEMINI_MODEL.',
      task: normalizedTask,
    };
  }

  return {
    ok: true,
    model,
    task: normalizedTask,
    source: requested ? 'request_override' : (models[normalizedTask] ? `task_profile:${normalizedTask}` : 'primary'),
    fallbackConfigured: Boolean(models.fallback),
    fallbackModel: models.fallback || null,
    automaticFallback: false,
  };
}

export function mercySoulModelRouterStatus(env = process.env) {
  const models = configuredModels(env);
  return {
    enabled: Boolean(models.primary),
    mode: 'policy-based model selection',
    primaryConfigured: Boolean(models.primary),
    profiles: Object.fromEntries(
      [...TASK_CLASSES].map((task) => [task, Boolean(models[task] || models.primary)]),
    ),
    fallbackConfigured: Boolean(models.fallback),
    automaticFallback: false,
    providerCalls: 0,
    executionAuthority: false,
  };
}
