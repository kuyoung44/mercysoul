import { getAdapter } from './adapters.js';
import { routeCommand } from './router.js';
import { getCommandTask, updateCommandProgress } from '../agent/command-center.js';

const ACTION_PATTERNS = [
  { match: /\bdeploy\b.*\brender\b|\brender\b.*\bdeploy\b/i, provider: 'render', action: 'deploy' },
  { match: /\bdeploy\b.*\bvercel\b|\bvercel\b.*\bdeploy\b/i, provider: 'vercel', action: 'deploy' },
  { match: /\bstatus\b|\bhealth\b|\bcheck\b/i, action: 'status' },
];
function resolveActions(command, plan) {
  const explicit = ACTION_PATTERNS.find((rule) => rule.match.test(command));
  if (explicit?.provider) return [{ provider: explicit.provider, action: explicit.action }];
  const provider = plan.selectedTools?.[0]?.id;
  return provider ? [{ provider, action: explicit?.action || 'status' }] : [];
}
export async function executeOrchestrationTask(id, options = {}) {
  const loaded = await getCommandTask(id);
  if (!loaded) throw new Error('task not found');
  const task = loaded.task;
  const plan = routeCommand(task.command);
  const actions = resolveActions(task.command, plan);
  if (!actions.length) {
    await updateCommandProgress(id, 100, { phase: 'completed', message: 'No executable provider action matched the command.', results: [] });
    return { task: (await getCommandTask(id)).task, results: [] };
  }
  const results = [];
  for (let index = 0; index < actions.length; index += 1) {
    const step = actions[index];
    const adapter = getAdapter(step.provider);
    const progress = Math.round((index / actions.length) * 90);
    await updateCommandProgress(id, progress, { phase: 'executing', provider: step.provider, action: step.action, step: index + 1, total: actions.length });
    if (!adapter) {
      const result = { provider: step.provider, action: step.action, ok: false, error: 'No execution adapter is installed for this provider.' };
      results.push(result);
      await updateCommandProgress(id, progress, { phase: 'adapter-missing', ...result });
      continue;
    }
    try {
      const output = await adapter.execute(step.action, options.payload || {});
      const result = { provider: step.provider, action: step.action, ok: true, output };
      results.push(result);
      await updateCommandProgress(id, Math.round(((index + 1) / actions.length) * 90), { phase: 'step-complete', ...result });
    } catch (error) {
      const result = { provider: step.provider, action: step.action, ok: false, error: error instanceof Error ? error.message : String(error) };
      results.push(result);
      await updateCommandProgress(id, progress, { phase: 'step-failed', ...result });
      if (options.continueOnError !== true) return { task: (await getCommandTask(id)).task, results, halted: true };
    }
  }
  const ok = results.every((item) => item.ok);
  await updateCommandProgress(id, 100, { phase: ok ? 'completed' : 'completed-with-errors', message: ok ? 'All execution steps completed.' : 'Execution completed with one or more provider errors.', results });
  return { task: (await getCommandTask(id)).task, results, halted: false };
}
