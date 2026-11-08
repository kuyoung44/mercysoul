import { findTool, listTools } from './tool-registry.js';

const RULES = [
  { match: /github|repo|commit|pull request|issue|branch|workflow/i, tools: ['github'] },
  { match: /supabase|database|sql|table|migration|edge function/i, tools: ['supabase'] },
  { match: /render|deploy|service|logs|metrics/i, tools: ['render'] },
  { match: /vercel|deployment|domain/i, tools: ['vercel'] },
  { match: /notion|document|knowledge|wiki/i, tools: ['notion'] },
  { match: /email|outlook|mail/i, tools: ['outlook'] },
  { match: /canva|design|presentation/i, tools: ['canva'] },
  { match: /runway|video|image generation|audio/i, tools: ['runway'] },
  { match: /research|paper|company|news|search the web/i, tools: ['exa','firecrawl'] },
  { match: /file|library|pdf|document upload/i, tools: ['files'] },
  { match: /computer|terminal|desktop|downloads folder/i, tools: ['remote-desktop'] },
  { match: /stripe|payment|subscription|price/i, tools: ['stripe'] },
  { match: /analytics|posthog|experiment|feature flag/i, tools: ['posthog','amplitude'] },
  { match: /fantasy|matchup|roster|league|draft/i, tools: ['flaim-fantasy'] },
  { match: /privacy|data broker/i, tools: ['privacyhawk'] },
  { match: /fitness|sleep|workout|garmin/i, tools: ['fitness-ai'] },
  { match: /remind|schedule|automation/i, tools: ['automations'] },
  { match: /connect|disconnect|permission|plugin/i, tools: ['plugin-management'] },
];

const MUTATION_INTENT = /\b(deploy|publish|create|update|delete|remove|write|commit|merge|checkpoint|migrate|migration|alter|drop|insert|refund|charge|send|grant|revoke|pause|resume|provision|execute|change|rotate|enable|disable)\b/i;
const READ_ONLY_START = /^\s*(?:(?:please|can you|could you|would you)\s+)?(?:check|show|list|read|inspect|view|get|find|search|fetch|compare|audit|review|what|which|how|status|health)\b/i;

export function isExplicitReadOnlyIntent(command) {
  const text = String(command || '').trim();
  return Boolean(text && READ_ONLY_START.test(text) && !MUTATION_INTENT.test(text));
}

export function routeCommand(command) {
  const text = String(command || '').trim();
  const matched = new Set();
  for (const rule of RULES) if (rule.match.test(text)) rule.tools.forEach(id => matched.add(id));
  const selected = [...matched].map(findTool).filter(Boolean);
  const writeCapableProviderSelected = selected.some(tool => ['write','high-write','financial-write'].includes(tool.risk));
  return {
    command: text,
    selectedTools: selected,
    requiresApproval: writeCapableProviderSelected && !isExplicitReadOnlyIntent(text),
    plan: selected.map(tool => ({ tool: tool.id, provider: tool.provider, capabilities: tool.capabilities })),
    availableToolCount: listTools().length,
  };
}
