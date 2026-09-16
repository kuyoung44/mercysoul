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
  const parts = candidate?.content?.parts || [];
  const text = parts.map((part) => part.text || '').join('').trim();
  return {
    text,
    grounding: candidate?.groundingMetadata || null,
    annotations: parts.flatMap((part) => Array.isArray(part.annotations) ? part.annotations : []),
  };
}

function normalizeUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const url = value.trim();
  if (!/^https?:\/\//i.test(url)) return null;
  return url;
}

function sourcesFrom(result) {
  const grounding = result?.grounding || {};
  const chunks = Array.isArray(grounding.groundingChunks) ? grounding.groundingChunks : [];
  const sources = [];

  for (const chunk of chunks) {
    const web = chunk?.web;
    const url = normalizeUrl(web?.uri);
    if (url) sources.push({ title: web?.title || url, url });
  }

  // Current Gemini responses can also expose URL citations as annotations.
  for (const annotation of result?.annotations || []) {
    const url = normalizeUrl(annotation?.url || annotation?.uri || annotation?.source?.url);
    if (url) sources.push({ title: annotation?.title || url, url });
  }

  const map = new Map();
  for (const source of sources) if (!map.has(source.url)) map.set(source.url, source);
  return [...map.values()];
}

function searchesFrom(result) {
  const queries = result?.grounding?.webSearchQueries;
  return Array.isArray(queries) ? queries.filter((q) => typeof q === 'string' && q.trim()).map((q) => q.trim()) : [];
}

function uniqueStrings(groups) {
  return [...new Set(groups.flat().filter(Boolean))];
}

function uniqueSources(groups) {
  const map = new Map();
  for (const source of groups.flat()) {
    if (source?.url && !map.has(source.url)) map.set(source.url, source);
  }
  return [...map.values()].slice(0, 30);
}

function groundingState(results) {
  const sources = uniqueSources(results.map(sourcesFrom));
  const searches = uniqueStrings(results.map(searchesFrom));
  const metadataPresent = results.some((result) => Boolean(result?.grounding));
  return {
    grounded: sources.length > 0,
    metadataPresent,
    sourceCount: sources.length,
    searchCount: searches.length,
  };
}

export async function runDeepResearch({ query, context = '', mode = 'deep' } = {}) {
  const question = cleanText(query, MAX_QUERY);
  const userContext = cleanText(context, MAX_CONTEXT);
  if (!question) throw new Error('A research question is required.');

  const requestId = crypto.randomUUID();
  const base = `You are the MercySoul Deep Research Engine. Research the user's question using current public web evidence when possible. Separate established facts, analysis, uncertainty, and conflicting claims. Prefer primary/official sources and high-quality reporting. Never invent citations. User question:\n${question}\n\nAdditional user knowledge/context (treat as input, not automatically verified):\n${userContext || '(none)'}`;

  const first = await gemini(`${base}\n\nProduce a research brief with: key findings, important dates/numbers, competing explanations, and a source trail. Use Google Search grounding when current evidence is needed.`, { search: true });
  const firstSources = sourcesFrom(first);
  const firstSearches = searchesFrom(first);

  if (mode === 'quick') {
    const grounding = groundingState([first]);
    return {
      ok: true,
      requestId,
      mode,
      answer: first.text,
      sources: firstSources,
      searches: firstSearches,
      model: modelName(),
      grounded: grounding.grounded,
      grounding: {
        status: grounding.grounded ? 'grounded' : grounding.metadataPresent ? 'metadata-without-source-urls' : 'metadata-missing',
        sourceCount: grounding.sourceCount,
        searchCount: grounding.searchCount,
      },
    };
  }

  const second = await gemini(`${base}\n\nAct as an independent verification pass. Look specifically for primary sources, counter-evidence, corrections, limitations, and information that could falsify or materially change the first research pass. Preserve and inspect the search-grounding evidence; never invent a URL. First-pass notes:\n${cleanText(first.text, MAX_EVIDENCE)}`, { search: true });
  const secondSources = sourcesFrom(second);
  const secondSearches = searchesFrom(second);

  const synthesis = await gemini(`You are the senior research synthesizer for MercySoul. Combine two independent web-grounded research passes into one rigorous answer. Do not add facts that are not supported by the supplied evidence. Preserve uncertainty. Explicitly distinguish:\n1) Established facts\n2) Evidence and source quality\n3) Areas of disagreement or uncertainty\n4) Practical synthesis\n5) Source list\n\nQUESTION:\n${question}\n\nPASS ONE:\n${cleanText(first.text, MAX_EVIDENCE)}\n\nPASS ONE SOURCES:\n${firstSources.map((s) => `${s.title} — ${s.url}`).join('\n') || '(none returned)'}\n\nPASS TWO / VERIFICATION:\n${cleanText(second.text, MAX_EVIDENCE)}\n\nPASS TWO SOURCES:\n${secondSources.map((s) => `${s.title} — ${s.url}`).join('\n') || '(none returned)'}\n\nUse concise headings. Do not manufacture URLs. If source metadata is missing, state that limitation rather than guessing a citation.`, { search: false });

  const allSources = uniqueSources([firstSources, secondSources]);
  const allSearches = uniqueStrings([firstSearches, secondSearches]);
  const grounding = groundingState([first, second]);

  return {
    ok: true,
    requestId,
    mode,
    answer: synthesis.text,
    sources: allSources,
    searches: allSearches,
    model: modelName(),
    passes: 3,
    grounded: grounding.grounded,
    grounding: {
      status: grounding.grounded ? 'grounded' : grounding.metadataPresent ? 'metadata-without-source-urls' : 'metadata-missing',
      sourceCount: grounding.sourceCount,
      searchCount: grounding.searchCount,
    },
  };
}

export function deepResearchStatus() {
  return {
    enabled: Boolean(process.env.GEMINI_API_KEY),
    provider: 'Google Gemini + Google Search grounding',
    model: modelName(),
    modes: ['quick', 'deep'],
    architecture: 'web research → independent verification → synthesis',
    citations: 'grounding metadata + URL annotations + source URLs',
  };
}
