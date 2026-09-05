import { evaluateGate, DENIAL_MESSAGE, sealedGateStatus } from '../src/sealed-gate.js';
export default function handler(req, res) {
  const text = req.body?.message || req.body?.text || req.query?.message || '';
  const result = evaluateGate(req, text);
  if (result.blocked) return res.status(403).json({ ok: false, error: 'Access Denied', message: DENIAL_MESSAGE, ip: result.ip });
  return res.status(200).json({ ok: true, gate: sealedGateStatus(), message: 'Access granted.' });
}
