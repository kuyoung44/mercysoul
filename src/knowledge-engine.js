import { runDeepResearch } from './deep-research.js';

const MAX_QUERY = 6000;
const MAX_CONTEXT = 30000;
const MAX_SOURCES = 30;

function clean(value, max) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

function normalizeMode(value) {
  return ['quick', 'deep'].includes(value) ? value : 'deep';
}

export function buildKnowledgeContext({ context = '', documents = [], sources = [] } = {}) {
  const parts = [];
  const userContext = clean(context, 12000);
  if (userContext) parts.push(`USER CONTEXT:\n${userContext}`);

  if (Array.isArray(documents)) {
    documents.slice(0, 10).forEach((doc, index) => {
      const text = clean(doc?.text ?? doc, 6000);
      if (text) parts.push(`DOCUMENT ${index + 1}${doc?.name ? ` (${clean(doc.name, 120)})` : ''}:\n${text}`);
    });
  }

  if (Array.isArray(sources)) {
    sources.slice(0, MAX_SOURCES).forEach((source, index) => {
      const text = clean(source?.text ?? source, 3000);
      if (text) parts.push(`SUPPLIED SOURCE ${index + 1}${source?.title ? ` (${clean(source.title, 160)})` : ''}:\n${text}`);
    });
  }

  return parts.join('\n\n').slice(0, MAX_CONTEXT);
}

export async function runKnowledgeEngine({ query, context = '', documents = [], sources = [], mode = 'deep' } = {}) {
  const question = clean(query, MAX_QUERY);
  if (!question) throw new Error('A knowledge question is required.');

  const knowledge = buildKnowledgeContext({ context, documents, sources });
  const research = await runDeepResearch({ query: question, context: knowledge, mode: normalizeMode(mode) });

  return {
    ok: true,
    engine: 'MercySoul All-in-One Knowledge Engine',
    requestId: research.requestId,
    mode: research.mode,
    answer: research.answer,
    sources: research.sources || [],
    searches: research.searches || [],
    model: research.model,
    passes: research.passes || 1,
    knowledge: {
      contextIncluded: Boolean(knowledge),
      documents: Array.isArray(documents) ? Math.min(documents.length, 10) : 0,
      suppliedSources: Array.isArray(sources) ? Math.min(sources.length, MAX_SOURCES) : 0,
      webGrounding: true,
    },
  };
}

export function knowledgeEngineStatus() {
  return {
    name: 'MercySoul All-in-One Knowledge Engine',
    capabilities: ['web research', 'independent verification', 'knowledge mixing', 'document context', 'source trail', 'uncertainty separation'],
    modes: ['quick', 'deep'],
    provider: 'Google Gemini + Google Search grounding',
  };
}
