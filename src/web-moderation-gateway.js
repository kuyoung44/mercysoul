import crypto from 'node:crypto';
import { moderatePost } from './post-moderator.js';
const MAX_TEXT = 20_000;
const DEFAULT_SOURCE = 'unknown';
function normalize(value) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT); }
/** Evaluates submitted web/app content. It does not crawl, control, or silently alter the public internet. */
export function moderateWebContent(input = {}) {
  const content = normalize(input.content ?? input.text ?? input.title);
  const source = normalize(input.source || DEFAULT_SOURCE);
  const url = normalize(input.url);
  const id = input.id || `WEB-${crypto.randomUUID()}`;
  const moderation = moderatePost({ title: input.title, text: content, source, id, requestId: input.requestId });
  return { id, requestId: input.requestId || id, source, url, content, decision: moderation.decision, score: moderation.score, riskScore: moderation.riskScore ?? moderation.score, confidence: moderation.confidence, modelConfidence: moderation.modelConfidence ?? moderation.confidence, categoryWeight: moderation.categoryWeight ?? 0, categories: moderation.categories, reasons: moderation.reasons, seals: moderation.seals || [], leadershipDiscourse: moderation.leadershipDiscourse === true, policyVersion: moderation.policyVersion, modelId: moderation.modelId, reviewRequired: moderation.reviewRequired, hardSafety: moderation.hardSafety, moderatedAt: new Date().toISOString() };
}
export function shouldDisplayWebContent(result) { return result?.decision === 'allow'; }
