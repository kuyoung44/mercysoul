import express from 'express';
import { commandCenterStatus, createCommand, executeCommand } from './orchestrator.js';

const router = express.Router();

router.get('/command-center/status', (_req, res) => {
  res.json({ ok: true, commandCenter: commandCenterStatus() });
});

router.post('/command-center/plan', async (req, res) => {
  try {
    const task = await createCommand(req.body?.command, { requestId: req.requestId });
    res.status(200).json({ ok: true, task });
  } catch (error) {
    res.status(400).json({ ok: false, requestId: req.requestId, error: error instanceof Error ? error.message : 'Unable to plan command' });
  }
});

router.post('/command-center/execute', async (req, res) => {
  try {
    const task = req.body?.task;
    if (!task?.id || !task?.command) return res.status(400).json({ ok: false, error: 'task with id and command is required' });
    if (task.approvalRequired && req.body?.approved !== true) {
      return res.status(409).json({ ok: false, approvalRequired: true, task });
    }
    const result = await executeCommand({ ...task, status: 'queued' }, { requestId: req.requestId });
    res.status(result.status === 'failed' ? 502 : 200).json({ ok: result.status !== 'failed', task: result });
  } catch (error) {
    res.status(500).json({ ok: false, requestId: req.requestId, error: error instanceof Error ? error.message : 'Command execution failed' });
  }
});

router.post('/command-center/run', async (req, res) => {
  try {
    const task = await createCommand(req.body?.command, { requestId: req.requestId, approved: req.body?.approved === true });
    if (task.status === 'paused') return res.status(202).json({ ok: true, task, approvalRequired: true });
    const result = await executeCommand(task, { requestId: req.requestId });
    res.status(result.status === 'failed' ? 502 : 200).json({ ok: result.status !== 'failed', task: result });
  } catch (error) {
    res.status(400).json({ ok: false, requestId: req.requestId, error: error instanceof Error ? error.message : 'Command failed' });
  }
});

export default router;
