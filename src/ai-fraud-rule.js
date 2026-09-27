import crypto from 'node:crypto';

export const AI_FRAUD_RULE = Object.freeze({
  name: 'MercySoul AI-Assisted Fraud Rule',
  version: '1.0.0',
  principle: 'AI use alone is not fraud. AI-assisted fraud requires evidence of deceptive or fraudulent intent plus an AI-assistance signal.',
  firstSignal: 'review-once',
  confirmedSignal: 'block',
  equalTreatment: true,
  ownerExemption: false,
  adminExemption: false,
  clientExemption: false,
  auditRequired: true,
  automaticBlockOnFirstSignal: false
});

const AI_SIGNALS = [
  /\bai[- ]generated\b/i,
  /\bai[- ]assisted\b/i,
  /\bchatgpt\b/i,
  /\bllm\b/i,
  /\bdeepfake\b/i,
  /\bvoice clone\b/i,
  /\bsynthetic (voice|identity|document|image|video)\b/i,
  /\bautomated chatbot\b/i,
  /\bprompted (an|a) (ai|model|llm)\b/i
];

const FRAUD_SIGNALS = [
  /\b(phish|phishing)\b/i,
  /\bimpersonat(e|ion|ing)\b/i,
  /\b(fake|forged|fabricated)\b.{0,50}\b(invoice|receipt|document|identity|payment|proof|evidence)\b/i,
  /\b(stolen|false)\b.{0,30}\b(identity|credentials|card|account)\b/i,
  /\b(divert|redirect)\b.{0,40}\b(payment|funds|salary|invoice)\b/i,
  /\b(scam|fraud|fraudulent)\b/i,
  /\bpretend to be\b.{0,40}\b(bank|support|company|official|employee|customer)\b/i,
  /\bsteal\b.{0,40}\b(account|money|credentials)\b/i
];

const reviews = new Map();
const blockedAccounts = new Map();

function textOf(input = {}) {
  return String(input.content ?? input.text ?? input.message ?? input.body ?? '').slice(0, 20000);
}

function hasAny(patterns, text) {
  return patterns.some(pattern => pattern.test(text));
}

function accountIdOf(input = {}) {
  return String(input.accountId ?? input.userId ?? input.actorId ?? '').trim() || null;
}

export function assessAiFraud(input = {}) {
  const text = textOf(input);
  const aiAssisted = input.aiAssisted === true ||
    Boolean(input.aiTool || input.aiModel || input.generationMetadata?.model) ||
    hasAny(AI_SIGNALS, text);
  const fraudSignal = input.fraudSignal === true || input.fraudConfirmed === true || hasAny(FRAUD_SIGNALS, text);
  const confirmed = input.fraudConfirmed === true || input.aiFraudConfirmed === true;

  if (!aiAssisted || !fraudSignal) {
    return {
      matched: false,
      aiAssisted,
      fraudSignal,
      confirmed: false,
      decision: 'allow',
      reason: 'AI use without evidence of fraud is not a violation.'
    };
  }

  return {
    matched: true,
    aiAssisted: true,
    fraudSignal: true,
    confirmed,
    decision: confirmed ? 'block' : 'review',
    reason: confirmed
      ? 'AI-assisted fraud was explicitly confirmed by an authorized review.'
      : 'AI assistance and a fraud/deception signal were detected; one human review is required before blocking.'
  };
}

export function createFraudReview(input = {}, assessment = assessAiFraud(input)) {
  if (!assessment.matched || assessment.confirmed) return null;
  const accountId = accountIdOf(input);
  const key = accountId || `request:${input.requestId || crypto.randomUUID()}`;
  const existing = reviews.get(key);
  if (existing) return existing;

  const review = {
    reviewId: `AIF-${crypto.randomUUID()}`,
    accountId,
    status: 'review',
    decision: 'pending',
    createdAt: new Date().toISOString(),
    evidence: {
      requestId: input.requestId || null,
      source: input.source || input.path || 'unknown',
      contentId: input.id || null,
      aiAssisted: assessment.aiAssisted,
      fraudSignal: assessment.fraudSignal,
      reason: assessment.reason
    }
  };
  reviews.set(key, review);
  return review;
}

export function confirmFraudReview(reviewId, actor = 'authorized-reviewer') {
  const review = [...reviews.values()].find(item => item.reviewId === reviewId);
  if (!review) return { ok: false, error: 'FRAUD_REVIEW_NOT_FOUND' };
  if (review.decision !== 'pending') return { ok: false, error: 'FRAUD_REVIEW_ALREADY_DECIDED', review };

  review.decision = 'confirmed';
  review.status = 'blocked';
  review.reviewedAt = new Date().toISOString();
  review.reviewedBy = actor;

  if (review.accountId) {
    blockedAccounts.set(review.accountId, {
      accountId: review.accountId,
      status: 'blocked',
      reason: 'Confirmed AI-assisted fraud',
      reviewId: review.reviewId,
      blockedAt: review.reviewedAt
    });
  }
  return { ok: true, review };
}

export function clearFraudReview(reviewId, actor = 'authorized-reviewer') {
  const review = [...reviews.values()].find(item => item.reviewId === reviewId);
  if (!review) return { ok: false, error: 'FRAUD_REVIEW_NOT_FOUND' };
  if (review.decision !== 'pending') return { ok: false, error: 'FRAUD_REVIEW_ALREADY_DECIDED', review };
  review.decision = 'cleared';
  review.status = 'allowed';
  review.reviewedAt = new Date().toISOString();
  review.reviewedBy = actor;
  return { ok: true, review };
}

export function isAiFraudBlocked(accountId) {
  return Boolean(accountId && blockedAccounts.has(String(accountId)));
}

export function aiFraudStatus() {
  return {
    ...AI_FRAUD_RULE,
    openReviews: [...reviews.values()].filter(r => r.decision === 'pending').length,
    confirmedReviews: [...reviews.values()].filter(r => r.decision === 'confirmed').length,
    clearedReviews: [...reviews.values()].filter(r => r.decision === 'cleared').length,
    blockedAccounts: blockedAccounts.size
  };
}
