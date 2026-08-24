import crypto from 'node:crypto';
import { assessDominionContent } from './dominion-moderation.js';
function normalize(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
export function moderatePost(input = {}) {
  const text = normalize(input.text ?? input.content ?? input.caption);
  const title = normalize(input.title);
  const combined = `${title} ${text}`.trim();
  const assessment = assessDominionContent({ ...input, id: input.id, requestId: input.requestId, content: combined, source: input.source || 'app' });
  return { decision: assessment.decision, score: assessment.riskScore, confidence: assessment.modelConfidence, modelConfidence: assessment.modelConfidence, reasons: assessment.reasons, categories: assessment.categories, seals: assessment.seals, leadershipDiscourse: assessment.leadershipDiscourse, normalizedText: combined, riskScore: assessment.riskScore, categoryWeight: assessment.categoryWeight, policyVersion: assessment.policyVersion, modelId: assessment.modelId, reviewRequired: assessment.reviewRequired, hardSafety: assessment.hardSafety };
}
export function buildModeratorPost(input = {}, moderation) {
  return { id: input.id || `POST-${crypto.randomUUID()}`, text: normalize(input.text ?? input.content ?? input.caption), decision: moderation.decision, moderationScore: moderation.score, moderationRiskScore: moderation.riskScore ?? moderation.score, moderationConfidence: moderation.confidence, categoryWeight: moderation.categoryWeight ?? 0, categories: moderation.categories, reasons: moderation.reasons, seals: moderation.seals || [], leadershipDiscourse: moderation.leadershipDiscourse === true, policyVersion: moderation.policyVersion, modelId: moderation.modelId, reviewRequired: moderation.reviewRequired, hardSafety: moderation.hardSafety, moderatedAt: new Date().toISOString() };
}
