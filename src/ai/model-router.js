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

/** Classify work into a configured profile; never accepts a provider/model from user text. */
export function classifyMercySoulTask(text = '') {
  const value = clean(text).toLowerCase();
  if (!value) return 'general';

  if (/\b(debug|refactor|code|coding|program|javascript|typescript|python|sql|api|repository|github|deploy|compile|test suite|stack trace)\b/.test(value)) {
    return 'coding';
  }
  if (/\b(research|sources|citations|literature review|investigate|evidence|market analysis|competitor analysis)\b/.test(value)) {
    return 'research';
  }
  if (/\b(design|creative|artwork|image prompt|brand identity|story|poem|advert|advertisement|campaign|visual concept)\b/.test(value)) {
    return 'creative';
  }
  if (/\b(analyze|analyse|compare|evaluate|strategy|architecture|roadmap|plan|reason|root cause|trade.?off|decision)\b/.test(value)) {
    return 'reasoning';
  }
  if (value.length <= 120 && /^(hi|hello|hey|thanks|thank you|good morning|good afternoon|good evening)[!. ]*$/.test(value)) {
    return 'fast';
  }
  return 'general';
}

/**
 * Selects a model identifier for the existing AI SDK / Vercel AI Gateway path.
 * This module never calls a provider, retries a request, or executes a tool.
 */
export function selectMercySoulModel({ task = 'general', env = process.env } = {}) {
  const models = configuredModels(env);
  const normalizedTask = TASK_CLASSES.has(task) ? task : 'general';
  const model = models[normalizedTask] || models.primary;

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
    source: models[normalizedTask] && models[normalizedTask] !== models.primary
      ? `task_profile:${normalizedTask}`
      : 'primary',
    fallbackConfigured: Boolean(models.fallback),
    fallbackModel: models.fallback || null,
    automaticFallback: false,
  };
}

export function mercySoulModelRouterStatus(env = process.env) {
  const models = configuredModels(env);
  return {
    enabled: Boolean(models.primary),
    mode: 'task-classified model selection via AI SDK',
    primaryConfigured: Boolean(models.primary),
    profiles: Object.fromEntries(
      [...TASK_CLASSES].map((task) => [task, Boolean(models[task])]),
    ),
    fallbackConfigured: Boolean(models.fallback),
    automaticFallback: false,
    providerCalls: 0,
    executionAuthority: false,
  };
}
