const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || '';
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || '';
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const jsonHeaders = { Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };

async function getJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.text();
  let data; try { data = body ? JSON.parse(body) : {}; } catch { data = { raw: body.slice(0, 500) }; }
  if (!response.ok) throw new Error(`Provider request failed (${response.status}): ${data?.message || data?.error?.message || body.slice(0, 200)}`);
  return data;
}

export function providerStatus() {
  return {
    github: { configured: Boolean(GITHUB_TOKEN) },
    vercel: { configured: Boolean(VERCEL_TOKEN), projectConfigured: Boolean(VERCEL_PROJECT_ID), teamConfigured: Boolean(VERCEL_TEAM_ID) },
    supabase: { configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) },
  };
}

export async function githubRepoStatus(repo = process.env.GITHUB_REPOSITORY || 'kuyoung44/mercysoul') {
  if (!GITHUB_TOKEN) return { configured: false, message: 'GITHUB_TOKEN is not configured' };
  const data = await getJson(`https://api.github.com/repos/${repo}`, { headers: { ...jsonHeaders, Authorization: `Bearer ${GITHUB_TOKEN}` } });
  return { configured: true, repository: data.full_name, defaultBranch: data.default_branch, private: data.private, updatedAt: data.updated_at };
}

export async function vercelDeploymentStatus() {
  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) return { configured: false, message: 'VERCEL_TOKEN and VERCEL_PROJECT_ID are required' };
  const qs = new URLSearchParams({ projectId: VERCEL_PROJECT_ID, limit: '5' });
  if (VERCEL_TEAM_ID) qs.set('teamId', VERCEL_TEAM_ID);
  const data = await getJson(`https://api.vercel.com/v6/deployments?${qs}`, { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } });
  return { configured: true, deployments: (data.deployments || []).map(d => ({ id: d.uid, url: d.url, state: d.state, target: d.target, createdAt: d.createdAt })) };
}

export async function supabaseConnectionStatus() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return { configured: false, message: 'Supabase server credentials are not configured' };
  const data = await getJson(`${SUPABASE_URL}/rest/v1/mercysoul_agent_tasks?select=id&limit=1`, {
    headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
  });
  return { configured: true, reachable: true, sampleRows: Array.isArray(data) ? data.length : 0 };
}
