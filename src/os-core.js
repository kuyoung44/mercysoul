import crypto from 'node:crypto';
import { moderatePost } from './post-moderator.js';
import { moderateWebContent } from './web-moderation-gateway.js';
import { DOMINION_POLICY } from './dominion-moderation.js';
import { constitutionStatus } from './governance/constitution.js';
import { RELATIONSHIP_CONTEXT_POLICY } from './relationship-context.js';
import { evaluateInternetProtocols, protocolGatewayStatus, startProtocolRefresh } from './internet-protocol-gateway.js';
import { legacyStatus } from './legacy-engine.js';

const VERSION = '3.3.0';
const startedAt = new Date().toISOString();
startProtocolRefresh();
const modules = {
  security: { status: 'ready', responsibilities: ['headers', 'rate-limit', 'admin-auth', 'privacy-boundary'] },
  moderation: { status: 'ready', responsibilities: ['post', 'web', 'risk-score', 'review', 'remove', 'audit-metadata'] },
  vision: { status: 'ready', responsibilities: ['verification', 'creative-brief', 'intent-clarity'] },
  identity: { status: 'ready', responsibilities: ['consent', 'external-data-boundary', 'visual-non-assumption'] },
  connection: { status: 'ready', responsibilities: ['honest-interaction', 'anti-coercion', 'relationship-context'] },
  governance: { status: 'ready', responsibilities: ['constitution-v3', 'equal-treatment', 'security-precedence'] },
  relationshipContext: { status: 'ready', responsibilities: ['context-only', 'no-relationship-inference', 'no-online-inference', 'explicit-consent'] },
  alignment: { status: 'ready', responsibilities: ['authorization', 'intent'] },
  creation: { status: 'ready', responsibilities: ['creative-pipeline', 'mercy-soul-signature'] },
  persistence: { status: 'ready', responsibilities: ['durable-store', 'audit'] },
  internetProtocolGateway: { status: 'ready', responsibilities: ['approved-https-sources', 'validation', 'periodic-refresh', 'human-review-boundary'] },
  legacy: { status: 'ready', responsibilities: ['milestone-records', 'provenance', 'continuity', 'human-readable-legacy'] }
};
export function osStatus() {
  return { id: 'MERCYSOUL-OS', coreVersion: VERSION, runtime: 'node', startedAt, modules, constitution: constitutionStatus(), relationshipContext: RELATIONSHIP_CONTEXT_POLICY, internetProtocolGateway: protocolGatewayStatus(), dominion: DOMINION_POLICY, legacy: legacyStatus(), policy: { moderationDecisions: ['allow', 'review', 'remove'], publicInternetControl: false, connectedSourceControl: true, humanReviewForAmbiguous: true, politicalViewpointNeutrality: true, securityAndPrivacyPrecedence: true } };
}
export function processInput(input = {}) {
  const type = input.type || 'post';
  const id = input.id || crypto.randomUUID();
  const requestId = input.requestId || input.request_id || id;
  const result = type === 'web' ? moderateWebContent({ ...input, id, requestId }) : moderatePost({ ...input, id, requestId });
  const protocolSignals = evaluateInternetProtocols(input.content || input.text || input.body || '');
  const reviewRequired = Boolean(result.reviewRequired ?? (result.decision === 'review')) || protocolSignals.review;
  return { id, requestId, type, decision: result.decision, score: result.score, riskScore: result.riskScore ?? result.score, confidence: result.confidence, modelConfidence: result.modelConfidence ?? result.confidence, categoryWeight: result.categoryWeight ?? 0, categories: result.categories, reasons: [...(result.reasons || []), ...protocolSignals.matches.map((m) => `internet-protocol:${m.id}@${m.version}`)], seals: result.seals || [], leadershipDiscourse: result.leadershipDiscourse === true, policyVersion: result.policyVersion ?? DOMINION_POLICY.version, modelId: result.modelId ?? DOMINION_POLICY.model.active, reviewRequired, hardSafety: result.hardSafety === true, internetProtocolSignals: protocolSignals, processedAt: new Date().toISOString() };
}
