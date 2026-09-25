import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandTask, controlCommandTask, updateCommandProgress, getCommandTask } from './agent/command-center.js';

test('Command Center supports low-priority, pause, resume and stop', async () => {
  const created = await createCommandTask('test command', { priority: 'normal', agents: 3 });
  assert.equal(created.task.status, 'running');
  assert.equal(created.task.agents.length, 3);

  const low = await controlCommandTask(created.task.id, 'low-priority');
  assert.equal(low.task.priority, 'low');

  const paused = await controlCommandTask(created.task.id, 'pause');
  assert.equal(paused.task.status, 'paused');
  assert.equal(paused.task.agents.every((agent) => agent.status === 'paused'), true);

  const resumed = await controlCommandTask(created.task.id, 'resume');
  assert.equal(resumed.task.status, 'running');
  assert.ok(resumed.task.resumedAt);

  const completed = await updateCommandProgress(created.task.id, 100, { phase: 'done', message: 'test complete' });
  assert.equal(completed.task.status, 'completed');

  const loaded = await getCommandTask(created.task.id);
  assert.equal(loaded.task.progress, 100);
});
