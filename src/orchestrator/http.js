import express from 'express';
import { createCommandTask, getCommandTask, controlCommandTask } from '../agent/command-center.js';
import { routeCommand } from './router.js';
import { toolRegistryStatus } from './tool-registry.js';
import { authorizeOrchestration } from './guard.js';
import { executeOrchestrationTask } from './executor.js';

const router = express.Router();

router.get('/orchestrator/status', (req, res) => {
  const auth = authorizeOrchestration(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
  res.json({ ok: true, registry: toolRegistryStatus() });
});

router.post('/orchestrator/plan', (req, res) => {
  const auth = authorizeOrchestration(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
  const command = req.body?.command;
  if (!command) return res.status(400).json({ ok: false, error: 'command is required' });
  res.json({ ok: true, ...routeCommand(command) });
});

router.post('/orchestrator/command', async (req, res) => {
  const auth = authorizeOrchestration(req, { allowWrite: true });
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
  const command = req.body?.command;
  if (!command) return res.status(400).json({ ok: false, error: 'command is required' });
  const plan = routeCommand(command);
  if (plan.requiresApproval && req.body?.execute !== true) {
    return res.status(202).json({ ok: true, execution: 'approval-required', plan });
  }
  try {
    const accepted = await createCommandTask(command, { agents: req.body?.agents, priority: req.body?.priority });
    const execution = await executeOrchestrationTask(accepted.task.id, { payload: req.body?.payload || {}, continueOnError: req.body?.continueOnError === true });
    res.status(execution.halted ? 502 : 201).json({ ok: !execution.halted, execution: execution.halted ? 'halted' : 'completed', plan, ...execution });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/orchestrator/tasks/:id', async (req, res) => {
  const auth = authorizeOrchestration(req);
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
  const result = await getCommandTask(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: 'task not found' });
  res.json({ ok: true, ...result });
});

router.post('/orchestrator/tasks/:id/control', async (req, res) => {
  const auth = authorizeOrchestration(req, { allowWrite: true });
  if (!auth.ok) return res.status(auth.status).json({ ok: false, error: auth.error });
  try {
    const result = await controlCommandTask(req.params.id, req.body?.action, req.body?.payload || {});
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

export default router;
