import { prepareMemoryObservation } from './memory-policy.js';
import { canAgentReadMemory } from './memory-access.js';

const AGENTS = Object.freeze(['vision', 'builder', 'business', 'research', 'marketing', 'guardian']);
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const PUBLIC_KEY = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || SERVICE_KEY);
const PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

function configured() {
  return Boolean(SUPABASE_URL && SERVICE_KEY && PUBLIC_KEY);
}

function validProjectId(value) {
  return value == null || value === '' || (typeof value === 'string' && PROJECT_ID_PATTERN.test(value));
}

async function authenticate(accessToken) {
  if (!configured()) return { ok: false, status: 503, error: 'Memory service is not configured' };
  if (!accessToken) return { ok: false, status: 401, error: 'A signed-in Supabase session is required' };
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: PUBLIC_KEY, Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, status: 401, error: 'Invalid or expired session' };
    const user = await response.json().catch(() => null);
    if (!user?.id) return { ok: false, status: 401, error: 'Authenticated user could not be verified' };
    return { ok: true, user };
  } catch {
    return { ok: false, status: 503, error: 'Authentication service is temporarily unavailable' };
  }
}

function dbHeaders(prefer = 'return=representation') {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  };
}

function bearer(req) {
  const value = String(req.get('authorization') || '');
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

export function memoryServiceStatus() {
  return {
    enabled: configured(),
    provider: 'supabase',
    table: 'ms_agent_memories',
    agents: [...AGENTS],
    authentication: 'Supabase Auth access token required',
    consentRequired: true,
    ownerScoped: true,
    projectScoped: true,
    privateMemoryAgentAllowlist: true,
    serviceRoleServerOnly: true,
    agentWritesEnabled: configured(),
    agentReadsEnabled: configured(),
  };
}

async function verifyRequest(req, res) {
  const auth = await authenticate(bearer(req));
  if (!auth.ok) {
    res.status(auth.status).json({ ok: false, error: auth.error });
    return null;
  }
  const agentId = String(req.body?.agentId || '').trim().toLowerCase();
  if (!AGENTS.includes(agentId)) {
    res.status(400).json({ ok: false, error: 'A registered agentId is required' });
    return null;
  }
  return { user: auth.user, agentId };
}

export async function rememberForAgent({ accessToken, ownerId, agentId, input = {} } = {}) {
  if (!configured()) return { ok: false, status: 503, error: 'Memory service is not configured' };
  const auth = await authenticate(accessToken);
  if (!auth.ok) return auth;
  if (ownerId && ownerId !== auth.user.id) return { ok: false, status: 403, error: 'Owner identity mismatch' };
  if (!AGENTS.includes(agentId)) return { ok: false, status: 400, error: 'Unknown agent' };
  if (!validProjectId(input.projectId)) return { ok: false, status: 400, error: 'Invalid projectId format' };

  const prepared = prepareMemoryObservation({ ...input, userOptIn: input.userOptIn === true });
  if (!prepared.stored) return { ok: false, status: 400, reason: prepared.reason };

  const visibility = input.visibility === 'private' || input.private === true ? 'private' : 'shared';
  const requestedAgents = Array.isArray(input.allowedAgents) ? input.allowedAgents : (visibility === 'shared' ? AGENTS : [agentId]);
  const allowedAgents = [...new Set([agentId, ...requestedAgents.map((item) => String(item).toLowerCase())])];
  if (allowedAgents.some((id) => !AGENTS.includes(id))) return { ok: false, status: 400, error: 'allowedAgents contains an unknown agent' };

  const expiresAt = prepared.observation.retention === 'session'
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;
  const row = {
    owner_id: auth.user.id,
    project_id: prepared.observation.projectId,
    memory_type: prepared.observation.type,
    content: prepared.observation.content,
    summary: prepared.observation.content.slice(0, 240),
    tags: prepared.observation.tags,
    source: prepared.observation.source,
    consent_status: 'approved',
    visibility,
    allowed_agents: allowedAgents,
    retention: prepared.observation.retention,
    expires_at: expiresAt,
    metadata: { provenance: 'explicit-user-approved', capture: 'agent-memory-api' },
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ms_agent_memories`, {
      method: 'POST',
      headers: dbHeaders('return=representation'),
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { ok: false, status: 502, error: 'Memory could not be saved' };
    const savedRows = await response.json();
    const saved = Array.isArray(savedRows) ? savedRows[0] : null;
    if (!saved?.id) return { ok: false, status: 502, error: 'Memory save could not be verified' };
    return { ok: true, memory: { id: saved.id, type: saved.memory_type, visibility: saved.visibility, allowedAgents: saved.allowed_agents, createdAt: saved.created_at } };
  } catch {
    return { ok: false, status: 503, error: 'Memory storage is temporarily unavailable' };
  }
}

export async function recallForAgent({ accessToken, ownerId, agentId, projectId = null, limit = 20 } = {}) {
  if (!configured()) return { ok: false, status: 503, error: 'Memory service is not configured' };
  const auth = await authenticate(accessToken);
  if (!auth.ok) return auth;
  if (ownerId && ownerId !== auth.user.id) return { ok: false, status: 403, error: 'Owner identity mismatch' };
  if (!AGENTS.includes(agentId)) return { ok: false, status: 400, error: 'Unknown agent' };
  if (!validProjectId(projectId)) return { ok: false, status: 400, error: 'Invalid projectId format' };

  const now = new Date().toISOString();
  const safeLimit = Math.max(1, Math.min(Number.isInteger(Number(limit)) ? Number(limit) : 20, 50));
  const params = new URLSearchParams({
    select: 'id,owner_id,project_id,memory_type,content,summary,tags,source,consent_status,visibility,allowed_agents,retention,expires_at,created_at',
    owner_id: `eq.${auth.user.id}`,
    consent_status: 'eq.approved',
    allowed_agents: `cs.{${agentId}}`,
    order: 'created_at.desc',
    limit: String(safeLimit),
  });
  if (projectId) {
    params.set('and', `(or(project_id.is.null,project_id.eq.${projectId}),or(expires_at.is.null,expires_at.gt.${now}))`);
  } else {
    params.set('or', `(expires_at.is.null,expires_at.gt.${now})`);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/ms_agent_memories?${params}`, {
      headers: dbHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { ok: false, status: 502, error: 'Memory retrieval failed' };
    const rows = await response.json();
    if (!Array.isArray(rows)) return { ok: false, status: 502, error: 'Memory retrieval returned an invalid response' };
    const memories = rows.filter((row) => canAgentReadMemory(row, { ownerId: auth.user.id, agentId, projectId }));
    return { ok: true, memories: memories.map((row) => ({ id: row.id, type: row.memory_type, content: row.content, summary: row.summary, tags: row.tags, projectId: row.project_id, visibility: row.visibility, createdAt: row.created_at })) };
  } catch {
    return { ok: false, status: 503, error: 'Memory storage is temporarily unavailable' };
  }
}

function asyncRoute(handler) {
  return (req, res) => Promise.resolve(handler(req, res)).catch(() => {
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'Memory request failed safely' });
  });
}

export function createMemoryRouter(express) {
  const router = express.Router();
  router.get('/agent/memory/status', (_req, res) => res.json({ ok: true, memory: memoryServiceStatus() }));

  router.post('/agent/memory/remember', asyncRoute(async (req, res) => {
    const context = await verifyRequest(req, res);
    if (!context) return;
    const result = await rememberForAgent({
      accessToken: bearer(req),
      ownerId: context.user.id,
      agentId: context.agentId,
      input: req.body || {},
    });
    return res.status(result.ok ? 201 : result.status || 400).json(result);
  }));

  router.post('/agent/memory/recall', asyncRoute(async (req, res) => {
    const context = await verifyRequest(req, res);
    if (!context) return;
    const result = await recallForAgent({
      accessToken: bearer(req),
      ownerId: context.user.id,
      agentId: context.agentId,
      projectId: req.body?.projectId || null,
      limit: req.body?.limit,
    });
    return res.status(result.ok ? 200 : result.status || 400).json(result);
  }));

  return router;
}
