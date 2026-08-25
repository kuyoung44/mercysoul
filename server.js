import crypto from 'node:crypto';
import express from 'express';
import { osStatus, processInput } from './src/os-core.js';
import { DOMINION_POLICY } from './src/dominion-moderation.js';
import { constitutionStatus, evaluateConstitution, MERCYSOUL_CONSTITUTION } from './src/governance/constitution.js';
import { RELATIONSHIP_CONTEXT_POLICY, evaluateRelationshipContext } from './src/relationship-context.js';
import { globalJurisdictionStatus, GLOBAL_JURISDICTION_PROTOCOL } from './src/governance/global-jurisdiction.js';
import gazeRouter from './src/gaze.js';
import { INSTANT_JUSTICE_PROTOCOL, instantJusticeMiddleware } from './src/instant-justice.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  req.requestId = requestId;
  next();
});
app.use(instantJusticeMiddleware);

const ENGINE_VERSION = '5.0.0';

app.get('/', (_req, res) => res.json({
  service: 'MercySoul OS', status: 'LIVE', version: ENGINE_VERSION,
  dominion: 'MercySoul Dominion Auto Metric', governance: MERCYSOUL_CONSTITUTION.name,
  governanceVersion: MERCYSOUL_CONSTITUTION.version, rulerAccountability: true,
  relationshipContext: RELATIONSHIP_CONTEXT_POLICY.version, eyeLens: 'gaze protocol ready',
  instantJustice: INSTANT_JUSTICE_PROTOCOL.version, globalJurisdiction: GLOBAL_JURISDICTION_PROTOCOL.version,
  production: 'render'
}));
app.get('/health', (_req, res) => res.status(200).json({
  ok: true, service: 'MercySoul OS', version: ENGINE_VERSION, dominion: true,
  governance: true, governanceVersion: MERCYSOUL_CONSTITUTION.version,
  relationshipContext: true, eyeLens: true,
  instantJustice: INSTANT_JUSTICE_PROTOCOL.version, globalJurisdiction: GLOBAL_JURISDICTION_PROTOCOL.version
}));
app.get('/api/status', (_req, res) => res.json({
  ...osStatus(), serverEngineVersion: ENGINE_VERSION,
  moderationPolicyVersion: DOMINION_POLICY.version,
  instantJustice: INSTANT_JUSTICE_PROTOCOL,
  globalJurisdiction: globalJurisdictionStatus(),
  governance: constitutionStatus(), relationshipContext: RELATIONSHIP_CONTEXT_POLICY,
  eyeLens: { status: 'ready', protocol: 'gaze', cameraFeed: 'external-client-signal', authentication: 'api-key' }
}));
app.get('/api/moderation/policy', (_req, res) => res.json({ ...DOMINION_POLICY, instantJustice: INSTANT_JUSTICE_PROTOCOL, globalJurisdiction: GLOBAL_JURISDICTION_PROTOCOL }));
app.get('/api/governance/global-jurisdiction', (_req, res) => res.json(globalJurisdictionStatus()));
app.get('/api/governance/constitution', (_req, res) => res.json(MERCYSOUL_CONSTITUTION));
app.get('/api/governance/relationship-policy', (_req, res) => res.json(RELATIONSHIP_CONTEXT_POLICY));
app.post('/api/governance/evaluate-relationship', (req, res) => res.json({ ok: true, requestId: req.requestId, ...evaluateRelationshipContext(req.body || {}) }));
app.post('/api/governance/evaluate-constitution', (req, res) => res.json({ ok: true, ...evaluateConstitution(req.body || {}) }));
app.use('/api', gazeRouter);
app.post('/api/moderate', (req, res) => { try { const result = processInput({ ...req.body, requestId: req.requestId, type: req.body?.type || 'post' }); res.status(200).json({ ok: true, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to moderate content', requestId: req.requestId }); } });
app.post('/api/moderate/web', (req, res) => { try { const result = processInput({ ...req.body, requestId: req.requestId, type: 'web' }); res.status(200).json({ ok: true, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to moderate web content', requestId: req.requestId }); } });
app.post('/api/governance/evaluate', (req, res) => { try { const actor = req.body?.actor || 'citizen'; const result = processInput({ ...req.body, requestId: req.requestId, type: req.body?.type === 'web' ? 'web' : 'post', source: `governance:${actor}` }); res.status(200).json({ ok: true, governance: MERCYSOUL_CONSTITUTION.name, equalTreatment: true, actor, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to evaluate governance content', requestId: req.requestId }); } });
app.post('/api/verify', async (req, res) => res.json({ success: true, governanceBound: true, constitutionVersion: MERCYSOUL_CONSTITUTION.version, relationshipContextVersion: RELATIONSHIP_CONTEXT_POLICY.version, instantJustice: INSTANT_JUSTICE_PROTOCOL.version, globalJurisdiction: GLOBAL_JURISDICTION_PROTOCOL.version, text: 'MercySoul verification ready - test: ' + (req.body.prompt || '') }));

const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`MercySoul OS LIVE on ${PORT} — engine ${ENGINE_VERSION}`));
