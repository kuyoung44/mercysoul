import crypto from 'node:crypto';

const MAX_QUERY = 6000;
const MAX_CONTEXT = 12000;
const MAX_EVIDENCE = 18000;

function cleanText(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

function modelName() {
  return process.env.GEMINI_RESEARCH_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
}

async function gemini(contents, { search = false } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured.');
  const model = modelName();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: contents }] }],
      ...(search ? { tools: [{ google_search: {} }] } : {}),
      generationConfig: { temperature: 0.2 },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status}).`);
  const candidate = body?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
  return { text, grounding: candidate?.groundingMetadata || null };
}

function sourcesFrom(grounding) {
  const chunks = grounding?.groundingChunks || [];
  return chunks.map((chunk) => chunk.web).filter((item) => item?.uri).map((item) => ({ title: item.title || item.uri, url: item.uri }));
}

function uniqueSources(groups) {
  const map = new Map();
  for (const source of groups.flat()) if (!map.has(source.url)) map.set(source.url, source);
  return [...map.values()].slice(0, 30);
}

export async function runDeepResearch({ query, context = '', mode = 'deep' } = {}) {
  const question = cleanText(query, MAX_QUERY);
  const userContext = cleanText(context, MAX_CONTEXT);
  if (!question) throw new Error('A research question is required.');

  const requestId = crypto.randomUUID();
  const base = `You are the MercySoul Deep Research Engine. Research the user's question using current public web evidence when possible. Separate established facts, analysis, uncertainty, and conflicting claims. Prefer primary/official sources and high-quality reporting. Never invent citations. User question:\n${question}\n\nAdditional user knowledge/context (treat as input, not automatically verified):\n${userContext || '(none)'}`;

  const first = await gemini(`${base}\n\nProduce a research brief with: key findings, important dates/numbers, competing explanations, and a source trail.`, { search: true });
  const firstSources = sourcesFrom(first.grounding);

  if (mode === 'quick') {
    return { ok: true, requestId, mode, answer: first.text, sources: firstSources, searches: first.grounding?.webSearchQueries || [], model: modelName() };
  }

  const second = await gemini(`${base}\n\nAct as an independent verification pass. Look specifically for primary sources, counter-evidence, corrections, limitations, and information that could falsify or materially change the first research pass. First-pass notes:\n${cleanText(first.text, MAX_EVIDENCE)}`, { search: true });
  const secondSources = sourcesFrom(second.grounding);

  const synthesis = await gemini(`You are the senior research synthesizer for MercySoul. Combine two independent web-grounded research passes into one rigorous answer. Do not add facts that are not supported by the supplied evidence. Preserve uncertainty. Explicitly distinguish:\n1) Established facts\n2) Evidence and source quality\n3) Areas of disagreement or uncertainty\n4) Practical synthesis\n5) Source list\n\nQUESTION:\n${question}\n\nPASS ONE:\n${cleanText(first.text, MAX_EVIDENCE)}\n\nPASS TWO / VERIFICATION:\n${cleanText(second.text, MAX_EVIDENCE)}\n\nUse concise headings and cite claims by source title/URL in plain text where useful.`, { search: false });

  return {
    ok: true,
    requestId,
    mode,
    answer: synthesis.text,
    sources: uniqueSources([firstSources, secondSources]),
    searches: [...(first.grounding?.webSearchQueries || []), ...(second.grounding?.webSearchQueries || [])],
    model: modelName(),
    passes: 3,
  };
}

export function deepResearchStatus() {
  return {
    enabled: Boolean(process.env.GEMINI_API_KEY),
    provider: 'Google Gemini + Google Search grounding',
    model: modelName(),
    modes: ['quick', 'deep'],
    architecture: 'web research → independent verification → synthesis',
    citations: 'grounding metadata + source URLs',
  };
}
