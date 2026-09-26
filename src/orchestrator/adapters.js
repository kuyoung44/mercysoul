const jsonHeaders = (token) => ({ Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const detail = typeof body === 'string' ? body.slice(0, 500) : body?.message || body?.error || `HTTP ${response.status}`;
    throw new Error(`Provider request failed (${response.status}): ${detail}`);
  }
  return { status: response.status, body };
}
function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
export const adapters = {
  github: {
    async status() {
      const token = required('GITHUB_TOKEN');
      const repo = String(process.env.GITHUB_REPOSITORY || 'kuyoung44/mercysoul');
      const result = await request(`https://api.github.com/repos/${repo}`, { headers: { ...jsonHeaders(token), 'X-GitHub-Api-Version': '2022-11-28' } });
      return { provider: 'GitHub', action: 'status', repository: repo, defaultBranch: result.body?.default_branch, private: result.body?.private };
    },
    async execute(action = 'status') {
      if (action === 'status') return this.status();
      throw new Error(`GitHub adapter does not yet expose action "${action}".`);
    },
  },
  supabase: {
    async status() {
      const url = required('SUPABASE_URL').replace(/\/$/, '');
      const key = required('SUPABASE_SERVICE_ROLE_KEY');
      const table = String(process.env.SUPABASE_AGENT_TASKS_TABLE || 'mercysoul_agent_tasks');
      const result = await request(`${url}/rest/v1/${encodeURIComponent(table)}?select=id&limit=1`, { headers: jsonHeaders(key) });
      return { provider: 'Supabase', action: 'status', table, reachable: result.status >= 200 && result.status < 300 };
    },
    async execute(action = 'status', payload = {}) {
      if (action === 'status') return this.status();
      if (action === 'checkpoint') {
        const url = required('SUPABASE_URL').replace(/\/$/, '');
        const key = required('SUPABASE_SERVICE_ROLE_KEY');
        const table = String(process.env.SUPABASE_AGENT_TASKS_TABLE || 'mercysoul_agent_tasks');
        const result = await request(`${url}/rest/v1/${encodeURIComponent(table)}`, { method: 'POST', headers: { ...jsonHeaders(key), Prefer: 'return=minimal' }, body: JSON.stringify(payload) });
        return { provider: 'Supabase', action, status: result.status };
      }
      throw new Error(`Supabase adapter does not expose action "${action}".`);
    },
  },
  render: {
    async status() {
      const token = required('RENDER_API_KEY');
      const result = await request('https://api.render.com/v1/services?limit=20', { headers: jsonHeaders(token) });
      const services = Array.isArray(result.body) ? result.body : result.body?.services || [];
      return { provider: 'Render', action: 'status', services: services.map((s) => ({ id: s.service?.id || s.id, name: s.service?.name || s.name, status: s.service?.suspended || s.status || null })) };
    },
    async execute(action = 'status', payload = {}) {
      if (action === 'status') return this.status();
      if (action === 'deploy') {
        const token = required('RENDER_API_KEY');
        const serviceId = String(payload.serviceId || process.env.RENDER_SERVICE_ID || '').trim();
        if (!serviceId) throw new Error('RENDER_SERVICE_ID is not configured');
        const result = await request(`https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys`, { method: 'POST', headers: jsonHeaders(token), body: JSON.stringify({ clearCache: payload.clearCache === true ? 'clear' : 'do_not_clear', ...(payload.commitId ? { commitId: payload.commitId } : {}) }) });
        return { provider: 'Render', action, serviceId, deploy: result.body };
      }
      throw new Error(`Render adapter does not expose action "${action}".`);
    },
  },
  vercel: {
    async status() {
      const token = required('VERCEL_TOKEN');
      const result = await request('https://api.vercel.com/v9/projects?limit=20', { headers: jsonHeaders(token) });
      const projects = result.body?.projects || [];
      return { provider: 'Vercel', action: 'status', projects: projects.map((p) => ({ id: p.id, name: p.name, framework: p.framework || null })) };
    },
    async execute(action = 'status', payload = {}) {
      if (action === 'status') return this.status();
      if (action === 'deploy') {
        const hook = String(payload.deployHookUrl || process.env.VERCEL_DEPLOY_HOOK_URL || '').trim();
        if (!hook) throw new Error('VERCEL_DEPLOY_HOOK_URL is not configured');
        const result = await request(hook, { method: 'POST' });
        return { provider: 'Vercel', action, triggered: true, response: result.body };
      }
      throw new Error(`Vercel adapter does not expose action "${action}".`);
    },
  },
};
export function getAdapter(providerId) { return adapters[providerId] || null; }
