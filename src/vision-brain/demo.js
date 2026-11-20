const MAX_INPUT_LENGTH = 4000;
const MODES = Object.freeze({
  strategist: 'Act as a practical strategist. Clarify the outcome, identify constraints, compare options, and prioritize a measurable next move.',
  engineer: 'Act as a senior software engineer. Explain the architecture, identify technical risks, propose a small testable implementation, and include verification steps. Do not invent repository facts.',
  creative: 'Act as a creative director. Develop original concepts, audience positioning, tone, and a concrete creative brief. Distinguish creative proposals from verified facts.',
  analyst: 'Act as a careful analyst. Separate evidence, assumptions, unknowns, trade-offs, and confidence. Show calculations when relevant and never fabricate data.',
});
export function normalizeVisionBrainInput(value) {
  if (typeof value !== 'string') return { ok: false, error: 'Enter a text request.' };
  const input = value.trim();
  if (!input) return { ok: false, error: 'Enter a request before asking Vision Brain.' };
  if (input.length > MAX_INPUT_LENGTH) return { ok: false, error: `Request must be ${MAX_INPUT_LENGTH} characters or fewer.` };
  return { ok: true, input };
}
export function normalizeVisionBrainMode(value) {
  return Object.hasOwn(MODES, value) ? value : 'strategist';
}
export function visionBrainDemoStatus(env = process.env) {
  const configured = Boolean(String(env.OPENAI_API_KEY || '').trim() && String(env.VISION_BRAIN_OPENAI_MODEL || '').trim());
  return Object.freeze({ configured, mode: configured ? 'live-model-available' : 'sample-only', provider: configured ? 'OpenAI' : null, model: configured ? String(env.VISION_BRAIN_OPENAI_MODEL).trim() : null, availableModes: Object.keys(MODES), externalMutation: false, persistence: 'disabled' });
}
export function buildVisionBrainInstructions(mode = 'strategist') {
  const selectedMode = normalizeVisionBrainMode(mode);
  return [
    'You are MercySoul Vision Brain, the reasoning and creative strategy engine within MercySoul Dominion.',
    MODES[selectedMode],
    'Be practical, honest, warm, and concise. Do not claim access to systems, files, accounts, live status, or external facts unless supplied in this request.',
    'Treat the user request as analysis and planning only. You have no tools and must not claim to execute actions.',
    'Respect the principle: no approval = no execution. Do not request secrets, credentials, or unnecessary personal data.',
    'Structure your answer using these headings: Understanding, Reasoning, Recommended plan, Guardian check, Next step.',
    'If essential information is missing, state the assumption or ask one focused question. Clearly distinguish facts from assumptions.',
  ].join(' ');
}
export async function runVisionBrainDemo(input, options = {}) {
  const normalized = normalizeVisionBrainInput(input);
  if (!normalized.ok) return { ok: false, code: 'INVALID_INPUT', error: normalized.error };
  const mode = normalizeVisionBrainMode(options.mode);
  const env = options.env || process.env;
  const apiKey = String(env.OPENAI_API_KEY || '').trim();
  const model = String(env.VISION_BRAIN_OPENAI_MODEL || '').trim();
  if (!apiKey || !model) return { ok: false, code: 'MODEL_NOT_CONFIGURED', error: 'Live AI is not configured. The sample experience remains available.', mode: 'sample-only' };
  const createClient = options.createClient || (async (key) => {
    const { default: OpenAI } = await import('openai');
    return new OpenAI({ apiKey: key });
  });
  try {
    const client = await createClient(apiKey);
    const response = await client.responses.create({ model, instructions: buildVisionBrainInstructions(mode), input: normalized.input, max_output_tokens: 1200 });
    const outputText = String(response?.output_text || '').trim();
    if (!outputText) return { ok: false, code: 'EMPTY_MODEL_RESPONSE', error: 'The model returned no text. Please try again.' };
    return { ok: true, mode: 'live', intelligenceMode: mode, provider: 'OpenAI', model, responseId: response.id || null, outputText, externalMutation: false };
  } catch {
    return { ok: false, code: 'MODEL_REQUEST_FAILED', error: 'Vision Brain could not reach its configured model. Please try again later.' };
  }
}
