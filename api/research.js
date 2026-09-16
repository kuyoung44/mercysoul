import { runDeepResearch } from '../src/deep-research.js';
import { securityHeaders, validateOrigin } from '../src/api-security.js';

export default async function handler(req, res) {
  securityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!validateOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'Request origin is not authorized.' });
  }

  try {
    const result = await runDeepResearch({
      query: req.body?.query,
      context: req.body?.context,
      mode: req.body?.mode || 'deep',
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Research failed',
    });
  }
}
