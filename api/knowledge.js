import { runKnowledgeEngine, knowledgeEngineStatus } from '../src/knowledge-engine.js';
import { securityHeaders, validateOrigin, validateChatRequest } from '../src/api-security.js';

export default async function handler(req, res) {
  securityHeaders(res);
  res.setHeader('X-MercySoul-Engine', 'all-in-one-knowledge');

  if (req.method === 'GET') return res.status(200).json({ ok: true, ...knowledgeEngineStatus() });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!validateOrigin(req)) return res.status(403).json({ ok: false, error: 'Request origin is not authorized.' });

  const security = validateChatRequest(req);
  if (!security.allowed) {
    if (security.retryAfter) res.setHeader('Retry-After', String(security.retryAfter));
    return res.status(security.status).json({ ok: false, error: 'Request rate limited.', requestId: security.requestId });
  }

  try {
    const result = await runKnowledgeEngine({
      query: req.body?.query,
      context: req.body?.context,
      documents: req.body?.documents,
      sources: req.body?.sources,
      mode: req.body?.mode || 'deep',
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Knowledge engine failed',
      requestId: security.requestId,
    });
  }
}
