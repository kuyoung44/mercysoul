const WRITE_RISKS = new Set(['write','high-write','financial-write']);

export function authorizeOrchestration(req, { allowWrite = false } = {}) {
  const expected = String(process.env.ADMIN_API_TOKEN || '').trim();
  if (!expected) return { ok: false, status: 503, error: 'ADMIN_API_TOKEN is not configured' };
  const header = String(req.get('authorization') || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token !== expected) return { ok: false, status: 401, error: 'Unauthorized' };
  if (allowWrite && req.body?.execute === true) return { ok: true, mode: 'write-authorized' };
  return { ok: true, mode: 'plan-only' };
}

export function needsWriteApproval(selectedTools = []) {
  return selectedTools.some(tool => WRITE_RISKS.has(tool.risk));
}
