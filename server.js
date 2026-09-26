import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { config } from './config.js';
import { requestLogging } from './middleware/requestLogging.js';
import { healthRateLimit } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { osStatus, processInput } from './src/os-core.js';
import { DOMINION_POLICY } from './src/dominion-moderation.js';
import { constitutionStatus, evaluateConstitution, MERCYSOUL_CONSTITUTION } from './src/governance/constitution.js';
import { RELATIONSHIP_CONTEXT_POLICY, evaluateRelationshipContext } from './src/relationship-context.js';
import { globalJurisdictionStatus, GLOBAL_JURISDICTION_PROTOCOL } from './src/governance/global-jurisdiction.js';
import { WATCHTOWER_PROTOCOL, getWatchtowerAudit, watchtowerMiddleware, watchtowerStatus } from './src/watchtower.js';
import { INSTANT_JUSTICE_PROTOCOL, instantJusticeMiddleware } from './src/instant-justice.js';
import { MERCYSOUL_ENGINE, engineStatus } from './src/engine/v8-engine.js';
import { OBSESSION_SHIELD_PROTOCOL, evaluateObsessionShield, obsessionShieldStatus } from './src/obsession-shield.js';
import { EMOTIONAL_SHIELD_PROTOCOL, evaluateEmotionalShield, emotionalShieldStatus } from './src/emotional-shield.js';
import { magneticStatus, trackMagneticInteraction } from './src/magnetic-attraction.js';
import { createTalismanOrder, divineIncomeStatus, isClientListAuthorized, listTalismanClients } from './src/divine-income.js';
import { deploymentDirectiveStatus, listDeploymentReports, recordDeploymentReport } from './src/deployment-directive.js';
import { createOAuthState, exchangeOAuthCode, listSmartThingsDevices, getSmartThingsLocations, sendSmartThingsCommand, smartThingsAuthorizeUrl, smartThingsStatus } from './src/smartthings.js';
import { supabaseStatus, persistEventBestEffort } from './src/supabase.js';
import { createGoogleOAuthUrl, completeGoogleOAuth, disconnectGoogle, googleOAuthStatus } from './src/google-oauth.js';
import gazeRouter from './src/gaze.js';
import { omnipresentHelpStatus, evaluateHelpSignal } from './src/omnipresent-help.js';
import { isBlockedIp, gateResponse, recordGateViolation, sealedGateStatus } from './src/sealed-gate.js';
import { operatingSystemStatus, executeOperatingSystem } from './src/mercyos-operating-system.js';
import { startVisionBrainTurn, executeVisionBrainTool, continueVisionBrainTurn, visionBrainAsyncStatus } from './src/vision-brain/async-agent.js';

const app = express();
app.disable('x-powered-by');

// Enterprise API envelope: preserve already-normalized responses, wrap legacy JSON payloads.
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    if (payload && typeof payload === 'object' && (payload.success === true || payload.success === false)) return originalJson(payload);
    if (payload && typeof payload === 'object' && payload.ok === false) {
      return originalJson({ success: false, error: payload.error || 'Request failed.', code: payload.code || 'REQUEST_FAILED' });
    }
    return originalJson({ success: true, data: payload ?? {} });
  };
  next();
});
app.use(requestLogging);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  const configuredOrigins = Array.isArray(config.ALLOWED_ORIGINS) ? config.ALLOWED_ORIGINS : [];
  const allowed = new Set([
    ...configuredOrigins,
    'https://mercy-vision.vercel.app',
    'https://mercysoul.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ]);
  if (origin && allowed.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static('public', { extensions: ['svg'] }));
const ROOT_INDEX = fileURLToPath(new URL('./index.html', import.meta.url));

app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('x-robots-tag', req.path.startsWith('/api/') ? 'noindex, nofollow, noarchive' : 'index, follow');
  req.requestId = requestId;
  next();
});
app.use((req, res, next) => {
  if (isBlockedIp(req)) return res.status(403).json(gateResponse());
  next();
});
app.use(watchtowerMiddleware);
app.use(instantJusticeMiddleware);

const ENGINE_VERSION = MERCYSOUL_ENGINE.version;
const SERVER_RELEASE = '10.1.7';
const HERCULES_WEBHOOK_PATH = '/webhooks/hercules';
const HELP_WEBHOOK_PATH = '/api/help/signal';
const smartThingsOAuthStates = new Set();
let smartThingsTokens = null;

app.get('/api/os/status', (_req, res) => res.json(operatingSystemStatus()));
app.post('/api/os/execute', async (req, res) => { try { const result = await executeOperatingSystem(req.body || {}, { requestId: req.requestId }); res.status(200).json(result); } catch (error) { res.status(400).json({ ok: false, requestId: req.requestId, error: error instanceof Error ? error.message : 'OS execution failed' }); } });

app.get('/api/vision/async/status', (_req, res) => res.json({ ok: true, visionBrain: visionBrainAsyncStatus() }));

app.post('/api/vision/async', async (req, res) => {
  const input = req.body?.input ?? req.body?.message ?? req.body?.text;
  if (typeof input !== 'string' && !Array.isArray(input)) {
    return res.status(400).json({ ok: false, error: 'input, message, or text is required', requestId: req.requestId });
  }

  try {
    const started = await startVisionBrainTurn(input);
    if (!started.call) {
      return res.status(200).json({
        ok: true,
        requestId: req.requestId,
        responseId: started.response.id,
        output: started.response.output,
        outputText: started.response.output_text || '',
        asyncTool: false,
      });
    }

    // Starting the async application job immediately is the critical part of the pattern.
    const job = executeVisionBrainTool(started.call).catch((error) => ({ error: error.message }));

    // Independent request handling could happen here without blocking the application
    // on the external tool. The continuation waits only when it actually needs the result.
    const result = await job;
    const continued = await continueVisionBrainTurn({
      previousResponseId: started.latestResponseId,
      call: started.call,
      result,
    });

    persistEventBestEffort({
      eventType: 'vision_brain_async_turn',
      requestId: req.requestId,
      payload: {
        responseId: continued.latestResponseId,
        tool: started.call.name,
        model: config.VISION_BRAIN_OPENAI_MODEL,
        async: true,
      },
    });

    return res.status(200).json({
      ok: true,
      requestId: req.requestId,
      responseId: continued.latestResponseId,
      output: continued.response.output,
      outputText: continued.response.output_text || '',
      asyncTool: true,
      tool: started.call.name,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      requestId: req.requestId,
      error: error.message,
      visionBrain: visionBrainAsyncStatus(),
    });
  }
});

app.get('/api/health', healthRateLimit, (_req, res) => res.status(200).json({
  success: true,
  data: { status: 'ok', uptime: process.uptime(), model: config.GEMINI_MODEL, memory: process.memoryUsage().rss },
}));

app.get('/api/gate', (_req, res) => res.status(200).json({ ok: true, ...sealedGateStatus() }));
app.post('/api/gate', (req, res) => {
  const result = recordGateViolation(req, { reason: req.body?.reason, disrespectful: req.body?.disrespectful, draining: req.body?.draining });
  res.status(result.blocked ? 403 : 200).json(result.blocked ? gateResponse() : result);
});

app.post(HELP_WEBHOOK_PATH, (req, res) => {
  try {
    const signal = evaluateHelpSignal({ ...req.body, requestId: req.requestId });
    persistEventBestEffort({ eventType: 'omnipresent_help', requestId: req.requestId, payload: { signal: signal.signal, triggered: signal.triggered, sanctuaryMode: signal.sanctuaryMode, locationAccepted: signal.locationAccepted } });
    res.status(signal.triggered ? 202 : 200).json({ ok: true, requestId: req.requestId, ...signal, help: omnipresentHelpStatus(), message: signal.triggered ? 'Help signal accepted. Sanctuary Mode activated; configured routing requires the relevant external integration and consent.' : 'No help trigger detected.' });
  } catch {
    res.status(400).json({ ok: false, error: 'Unable to process help signal', requestId: req.requestId });
  }
});
app.get('/api/help/status', (_req, res) => res.json({ ok: true, ...omnipresentHelpStatus() }));

const handleHerculesWebhook = (req, res) => {
  try {
    const magnetic = req.body?.interactionType ? trackMagneticInteraction({ type: req.body.interactionType, source: req.body.source || 'social-network' }) : null;
    const result = processInput({ ...req.body, requestId: req.requestId, type: req.body?.type || 'webhook', source: 'hercules-webhook', watchtowerIdentity: req.watchtower?.identity });
    persistEventBestEffort({ eventType: 'hercules_webhook', requestId: req.requestId, payload: { type: req.body?.type || 'webhook', source: req.body?.source || 'hercules-webhook', magnetic, decision: result?.decision || null } });
    res.status(200).json({ ok: true, webhook: 'hercules', requestId: req.requestId, ...result, magnetic, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus(), watchtower: watchtowerStatus(), emotionalShield: emotionalShieldStatus() });
  } catch {
    res.status(400).json({ ok: false, error: 'Unable to process Hercules webhook', requestId: req.requestId });
  }
};

app.get('/', (_req, res) => res.sendFile(ROOT_INDEX));
app.get('/health', (_req, res) => { const db = supabaseStatus(); res.status(db.healthy ? 200 : 503).json({ ok: db.healthy, service: 'MercySoul OS', version: ENGINE_VERSION, serverRelease: SERVER_RELEASE, engine: MERCYSOUL_ENGINE.name, omnipresentHelp: omnipresentHelpStatus(), helpWebhook: HELP_WEBHOOK_PATH, supabase: db }); });
app.get('/api/status', (_req, res) => res.json({ ...osStatus(), serverEngineVersion: ENGINE_VERSION, serverRelease: SERVER_RELEASE, engine: engineStatus(), moderationPolicyVersion: DOMINION_POLICY.version, instantJustice: INSTANT_JUSTICE_PROTOCOL, globalJurisdiction: globalJurisdictionStatus(), watchtower: watchtowerStatus(), obsessionShield: obsessionShieldStatus(), emotionalShield: emotionalShieldStatus(), governance: constitutionStatus(), relationshipContext: RELATIONSHIP_CONTEXT_POLICY, omnipresentHelp: omnipresentHelpStatus(), helpWebhook: HELP_WEBHOOK_PATH, herculesWebhook: HERCULES_WEBHOOK_PATH, magneticAttraction: magneticStatus(), divineIncome: divineIncomeStatus(), deploymentDirective: deploymentDirectiveStatus(), smartThings: smartThingsStatus(), googleOAuth: googleOAuthStatus(), supabase: supabaseStatus(), sealedGate: sealedGateStatus() }));
app.get('/api/auth/google', (_req, res) => { try { res.redirect(createGoogleOAuthUrl()); } catch (error) { res.status(503).json({ ok: false, error: error.message, googleOAuth: googleOAuthStatus() }); } });
app.get('/api/auth/google/callback', async (req, res) => { try { const result = await completeGoogleOAuth(req.query?.code, req.query?.state); persistEventBestEffort({ eventType: 'google_oauth_connected', requestId: req.requestId, payload: { email: result.email, scope: result.scope, connectedAt: result.connectedAt } }); res.status(200).json({ ok: true, authenticated: true, provider: 'google', profile: { email: result.email, name: result.name, picture: result.picture, subject: result.subject }, scope: result.scope, googleOAuth: googleOAuthStatus(), message: 'Google authorization completed. Gmail access is enabled only when the configured OAuth scope explicitly includes it.' }); } catch (error) { res.status(400).json({ ok: false, authenticated: false, error: error.message, googleOAuth: googleOAuthStatus() }); } });
app.get('/api/auth/google/status', (_req, res) => res.json({ ok: true, googleOAuth: googleOAuthStatus() }));
app.post('/api/auth/google/disconnect', (_req, res) => { disconnectGoogle(); res.json({ ok: true, connected: false, googleOAuth: googleOAuthStatus() }); });
app.get('/api/magnetic/status', (_req, res) => res.json(magneticStatus()));
app.get('/api/magnetic/talisman', (_req, res) => res.redirect('/magnetic-talisman.svg'));
app.post('/api/magnetic/interaction', (req, res) => { const result = trackMagneticInteraction({ type: req.body?.type, source: req.body?.source || 'social-network' }); persistEventBestEffort({ eventType: 'magnetic_interaction', requestId: req.requestId, payload: { type: req.body?.type || null, source: req.body?.source || 'social-network', result } }); res.json({ ok: true, requestId: req.requestId, ...result }); });
app.post('/api/order/talisman', async (req, res) => { try { const result = await createTalismanOrder({ ...req.body, requestId: req.requestId }); res.status(result.status || 201).json({ ok: result.ok, message: result.message, error: result.error, orderId: result.orderId, persistence: result.persistence, source: result.source, requestId: req.requestId }); } catch { res.status(500).json({ ok: false, error: 'Unable to create talisman order', requestId: req.requestId }); } });
app.get('/api/order/clients', async (req, res) => { if (!isClientListAuthorized(req.get('authorization'))) return res.status(401).json({ ok: false, error: 'Unauthorized', message: 'Provide a valid Bearer token.' }); try { const result = await listTalismanClients(); res.status(200).json(result); } catch { res.status(500).json({ ok: false, error: 'Unable to load talisman clients' }); } });
app.get('/api/deployment/order', (_req, res) => res.json(deploymentDirectiveStatus()));
app.get('/api/deployment/reports', (req, res) => res.json({ ok: true, directiveRef: deploymentDirectiveStatus().directive.ref, reports: listDeploymentReports(req.query.limit) }));
app.post('/api/deployment/report', (req, res) => { const description = String(req.body?.description || '').trim(); if (!description) return res.status(400).json({ ok: false, error: 'description is required', requestId: req.requestId }); const report = recordDeploymentReport({ category: req.body?.category, description, reporter: req.body?.reporter, requestId: req.requestId }); persistEventBestEffort({ eventType: 'deployment_report', requestId: req.requestId, payload: report }); res.status(201).json({ ok: true, report }); });
app.use('/api', gazeRouter);
app.get('/api/supabase/status', (_req, res) => { const status = supabaseStatus(); res.status(status.healthy ? 200 : 503).json(status); });
app.post('/api/supabase/test', async (req, res) => { const result = await persistEventBestEffort({ eventType: 'supabase_test', requestId: req.requestId, payload: { source: 'api-test', message: req.body?.message || 'MercySoul persistence test' } }); res.status(result.persisted ? 200 : 503).json({ ok: true, ...result }); });
app.get('/api/smartthings/status', (_req, res) => res.json(smartThingsStatus()));
app.get('/api/smartthings/connect', (req, res) => { try { const state = createOAuthState(); smartThingsOAuthStates.add(state); res.redirect(smartThingsAuthorizeUrl(state)); } catch (error) { res.status(503).json({ ok: false, error: error.message }); } });
app.get('/oauth/callback', async (req, res) => { const { code, state, error } = req.query; if (!state || !smartThingsOAuthStates.has(state)) return res.status(400).json({ ok: false, error: 'Invalid OAuth state' }); smartThingsOAuthStates.delete(state); if (error) return res.status(400).json({ ok: false, error: String(error) }); if (!code) return res.status(400).json({ ok: false, error: 'Missing authorization code' }); try { smartThingsTokens = await exchangeOAuthCode(code); res.json({ ok: true, connected: true, provider: 'SmartThings', scope: smartThingsTokens.scope, expiresIn: smartThingsTokens.expires_in, message: 'SmartThings connected. Credentials remain server-side.' }); } catch (error2) { res.status(502).json({ ok: false, error: error2.message }); } });
app.get('/api/smartthings/devices', async (_req, res) => { try { if (!smartThingsTokens?.access_token) return res.status(401).json({ ok: false, error: 'SmartThings account not connected' }); res.json({ ok: true, ...(await listSmartThingsDevices(smartThingsTokens.access_token)) }); } catch (error) { res.status(502).json({ ok: false, error: error.message }); } });
app.get('/api/smartthings/locations', async (_req, res) => { try { if (!smartThingsTokens?.access_token) return res.status(401).json({ ok: false, error: 'SmartThings account not connected' }); res.json({ ok: true, ...(await getSmartThingsLocations(smartThingsTokens.access_token)) }); } catch (error) { res.status(502).json({ ok: false, error: error.message }); } });
app.post('/api/smartthings/devices/:deviceId/command', async (req, res) => { try { if (!smartThingsTokens?.access_token) return res.status(401).json({ ok: false, error: 'SmartThings account not connected' }); const result = await sendSmartThingsCommand(smartThingsTokens.access_token, req.params.deviceId, req.body || {}); res.json({ ok: true, deviceId: req.params.deviceId, result }); } catch (error) { res.status(400).json({ ok: false, error: error.message }); } });
app.post('/api/moderate', (req, res) => { try { const result = processInput({ ...req.body, requestId: req.requestId, type: req.body?.type || 'post', watchtowerIdentity: req.watchtower?.identity }); persistEventBestEffort({ eventType: 'moderation', requestId: req.requestId, payload: { type: req.body?.type || 'post', decision: result?.decision || null, riskScore: result?.riskScore ?? null } }); res.status(200).json({ ok: true, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus(), watchtower: watchtowerStatus(), obsessionShield: obsessionShieldStatus(), emotionalShield: emotionalShieldStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to moderate content', requestId: req.requestId }); } });
app.post('/api/moderate/web', (req, res) => { try { const result = processInput({ ...req.body, requestId: req.requestId, type: 'web', watchtowerIdentity: req.watchtower?.identity }); persistEventBestEffort({ eventType: 'web_moderation', requestId: req.requestId, payload: { decision: result?.decision || null, riskScore: result?.riskScore ?? null } }); res.status(200).json({ ok: true, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus(), watchtower: watchtowerStatus(), obsessionShield: obsessionShieldStatus(), emotionalShield: emotionalShieldStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to moderate web content', requestId: req.requestId }); } });
app.post(HERCULES_WEBHOOK_PATH, handleHerculesWebhook);
app.post('/api/webhooks/hercules', handleHerculesWebhook);
app.post('/api/governance/evaluate', (req, res) => { try { const actor = req.body?.actor || 'citizen'; const result = processInput({ ...req.body, requestId: req.requestId, type: req.body?.type === 'web' ? 'web' : 'post', source: `governance:${actor}`, watchtowerIdentity: req.watchtower?.identity }); res.status(200).json({ ok: true, governance: MERCYSOUL_CONSTITUTION.name, equalTreatment: true, actor, ...result, instantJustice: req.instantJustice, globalJurisdiction: globalJurisdictionStatus(), watchtower: watchtowerStatus(), emotionalShield: emotionalShieldStatus() }); } catch { res.status(400).json({ ok: false, error: 'Unable to evaluate governance content', requestId: req.requestId }); } });
app.post('/api/verify', async (_req, res) => res.json({ success: true, governanceBound: true, engineVersion: ENGINE_VERSION, serverRelease: SERVER_RELEASE, constitutionVersion: MERCYSOUL_CONSTITUTION.version, omnipresentHelp: omnipresentHelpStatus(), helpWebhook: HELP_WEBHOOK_PATH, instantJustice: INSTANT_JUSTICE_PROTOCOL.version, globalJurisdiction: GLOBAL_JURISDICTION_PROTOCOL.version, sovereignJurisdictionVersion: MERCYSOUL_ENGINE.jurisdiction.version, watchtower: WATCHTOWER_PROTOCOL.version, obsessionShield: OBSESSION_SHIELD_PROTOCOL.version, emotionalShield: EMOTIONAL_SHIELD_PROTOCOL.version, herculesWebhook: HERCULES_WEBHOOK_PATH, magneticAttraction: magneticStatus(), divineIncome: divineIncomeStatus(), deploymentDirective: deploymentDirectiveStatus(), smartThings: smartThingsStatus(), googleOAuth: googleOAuthStatus(), supabase: supabaseStatus(), sealedGate: sealedGateStatus(), magneticTalisman: '/magnetic-talisman.svg' }));

export default app;

app.use(errorHandler);
