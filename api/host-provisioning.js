import { timingSafeEqual } from 'node:crypto';
import { createHostProvisionPlan, validateHostProvisionRequest } from '../src/host-provisioning.js';

function authorized(req) {
  const expected = String(process.env.ADMIN_API_TOKEN || '').trim();
  const actual = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!expected || !actual) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function githubPreflight(repository, branch, token) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const base = 'https://api.github.com/repos/' + repository.split('/').map(encodeURIComponent).join('/');
  const repoResponse = await fetch(base, { headers });
  if (!repoResponse.ok) return { ok: false, reason: 'repository_not_accessible' };
  const repo = await repoResponse.json();
  const branchResponse = await fetch(base + '/branches/' + encodeURIComponent(branch), { headers });
  if (!branchResponse.ok) return { ok: false, reason: 'branch_not_accessible' };
  return { ok: true, privateRepository: Boolean(repo.private), defaultBranch: repo.default_branch, branchExists: true };
}

async function vercelPreflight(project, token, teamId) {
  const query = teamId ? '?teamId=' + encodeURIComponent(teamId) : '';
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/json' };
  const access = await fetch('https://api.vercel.com/v9/projects?limit=1' + query, { headers });
  if (!access.ok) return { ok: false, reason: 'vercel_read_access_failed' };
  const response = await fetch('https://api.vercel.com/v9/projects/' + encodeURIComponent(project) + query, { headers });
  if (response.ok) {
    const data = await response.json();
    return { ok: true, existingProject: true, framework: data.framework || null };
  }
  if (response.status === 404) return { ok: true, existingProject: false, framework: null };
  return { ok: false, reason: 'vercel_project_lookup_failed' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  if (!process.env.ADMIN_API_TOKEN) return res.status(503).json({ ok: false, error: 'Admin authorization is not configured.' });
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const vercelToken = String(process.env.VERCEL_TOKEN || '').trim();
  if (!vercelToken) return res.status(503).json({ ok: false, error: 'Vercel read access is not configured.' });
  const validation = validateHostProvisionRequest({ ...req.body, mode: 'plan' });
  if (!validation.valid) return res.status(400).json({ ok: false, errors: validation.errors });
  try {
    const [github, vercel] = await Promise.all([
      githubPreflight(validation.request.repository, validation.request.branch, String(process.env.GITHUB_TOKEN || '').trim()),
      vercelPreflight(validation.request.project, vercelToken, String(process.env.VERCEL_TEAM_ID || '').trim())
    ]);
    if (!github.ok || !vercel.ok) {
      return res.status(502).json({ ok: false, externalMutation: false, error: 'Read-only preflight could not verify all integrations.', checks: { github, vercel } });
    }
    const result = createHostProvisionPlan(validation.request, {
      githubRepositoryAccessible: github.ok,
      githubBranchExists: github.branchExists,
      vercelReadAccessVerified: vercel.ok,
      existingProject: vercel.existingProject,
      checksComplete: true
    });
    return res.status(200).json({
      ...result,
      checks: {
        github: { ok: true, branchExists: github.branchExists, defaultBranch: github.defaultBranch, privateRepository: github.privateRepository },
        vercel: { ok: true, existingProject: vercel.existingProject, framework: vercel.framework }
      },
      notice: 'Read-only plan only. This endpoint cannot create, modify, or deploy a project.'
    });
  } catch {
    return res.status(502).json({ ok: false, externalMutation: false, error: 'Read-only preflight failed; no changes were made.' });
  }
}
