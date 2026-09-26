const tools = [
  { id: 'github', provider: 'GitHub', capabilities: ['repo.read','repo.write','branches','commits','pull_requests','issues','workflows'], risk: 'write' },
  { id: 'supabase', provider: 'Supabase', capabilities: ['projects','sql','tables','migrations','edge_functions','logs'], risk: 'write' },
  { id: 'render', provider: 'Render', capabilities: ['services','deploys','logs','metrics','environment'], risk: 'write' },
  { id: 'vercel', provider: 'Vercel', capabilities: ['projects','deployments','domains','environment'], risk: 'write' },
  { id: 'notion', provider: 'Notion', capabilities: ['search','documentation','tasks'], risk: 'write' },
  { id: 'outlook', provider: 'Outlook', capabilities: ['email.search','email.read'], risk: 'sensitive-read' },
  { id: 'canva', provider: 'Canva', capabilities: ['design.search','design.create','design.edit','feedback'], risk: 'write' },
  { id: 'runway', provider: 'Runway', capabilities: ['image','video','audio','edit'], risk: 'write' },
  { id: 'firecrawl', provider: 'Firecrawl', capabilities: ['web.search','extract','crawl','browser'], risk: 'read' },
  { id: 'exa', provider: 'Exa', capabilities: ['research','web.search','companies','papers','news'], risk: 'read' },
  { id: 'files', provider: 'Files', capabilities: ['search','read','materialize','library'], risk: 'sensitive-read' },
  { id: 'remote-desktop', provider: 'Remote Desktop Commander', capabilities: ['filesystem','terminal','browser'], risk: 'high-write' },
  { id: 'stripe', provider: 'Stripe', capabilities: ['products','prices','payment_links','payments','subscriptions'], risk: 'financial-write' },
  { id: 'posthog', provider: 'PostHog', capabilities: ['analytics','flags','experiments','errors'], risk: 'write' },
  { id: 'amplitude', provider: 'Amplitude', capabilities: ['charts','dashboards','metrics','experiments'], risk: 'write' },
  { id: 'flaim-fantasy', provider: 'Flaim Fantasy', capabilities: ['leagues','standings','rosters','matchups','drafts','players'], risk: 'read' },
  { id: 'privacyhawk', provider: 'PrivacyHawk', capabilities: ['privacy','data-exposure'], risk: 'sensitive-read' },
  { id: 'fitness-ai', provider: 'Fitness AI', capabilities: ['wellness','sleep','workouts','metrics'], risk: 'sensitive-read' },
  { id: 'automations', provider: 'Automations', capabilities: ['schedule','run','notify'], risk: 'write' },
  { id: 'plugin-management', provider: 'Plugin Management', capabilities: ['connections','permissions'], risk: 'high-write' },
];

export function listTools() {
  return tools.map(tool => ({ ...tool, status: 'available-to-orchestrator' }));
}

export function findTool(id) {
  return tools.find(tool => tool.id === id) || null;
}

export function toolRegistryStatus() {
  return { version: '1.0.0', count: tools.length, tools: listTools() };
}
