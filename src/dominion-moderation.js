import crypto from 'node:crypto';

export const DOMINION_POLICY = Object.freeze({
  name: 'MercySoul Dominion',
  version: '1.0.0',
  thresholds: Object.freeze({
    allow: 2.0,
    review: 4.5
  }),
  formula: 'riskScore = modelConfidence * categoryWeight',
  maxTextLength: 20_000
});

const CATEGORY_WEIGHTS = Object.freeze({
  sexual_exploitation: 10,
  non_consensual_sexual: 10,
  credible_violent_threat: 9,
  extremist_support: 9,
  hate_or_dehumanization: 8,
  self_harm_encouragement: 8,
  targeted_harassment: 6,
  manipulative_deception: 5,
  spam: 4,
  prompt_injection: 4
});

const HARD_SAFETY_CATEGORIES = new Set([
  'sexual_exploitation',
  'non_consensual_sexual',
  'credible_violent_threat',
  'extremist_support',
  'hate_or_dehumanization',
  'self_harm_encouragement'
]);

const PATTERNS = Object.freeze([
  ['sexual_exploitation', 0.99, /\b(child|minor)\b.{0,40}\b(sexual|porn|nude|exploitation)\b/i],
  ['non_consensual_sexual', 0.99, /\b(rape|sexual assault|non[- ]consensual sex)\b/i],
  ['credible_violent_threat', 0.96, /\b(i will|we will|going to)\s+(kill|murder|shoot|stab)\b|\bkill you\b/i],
  ['extremist_support', 0.95, /\b(join|support|recruit for)\b.{0,40}\b(terrorist|extremist)\b/i],
  ['hate_or_dehumanization', 0.91, /\b(all|every)\s+[a-z-]+\s+(are|should be)\s+(subhuman|vermin|animals)\b/i],
  ['self_harm_encouragement', 0.93, /\b(go|should)\s+(kill|hurt)\s+(yourself|themselves)\b/i],
  ['targeted_harassment', 0.82, /\b(dox|doxx|harass|swat)\b.{0,30}\b(you|them|him|her)\b/i],
  ['manipulative_deception', 0.72, /\b(fake|fabricated)\b.{0,30}\b(evidence|proof|news)\b/i],
  ['spam', 0.80, /(.)\1{8,}|\b(buy|click|dm)\s+(now|immediately)\b/i],
  ['prompt_injection', 0.90, /ignore\s+(all|any|the)\s+(previous|prior|above)\s+instructions?/i]
]);

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, DOMINION_POLICY.maxTextLength);
}

function detectLeadershipDiscourse(text) {
  return /\b(president|president's|presidential|government|leadership|national assembly|head of state)\b/i.test(text);
}

function classifyWithFallback(text) {
  const matches = [];
  for (const [category, confidence, pattern] of PATTERNS) {
    if (pattern.test(text)) matches.push({ category, confidence, weight: CATEGORY_WEIGHTS[category] });
  }
  return matches;
}

function decisionFor(riskScore, match) {
  if (riskScore > DOMINION_POLICY.thresholds.review) {
    // Automatic removal is reserved for high-confidence, hard-safety categories.
    // Political viewpoint or leadership discourse never changes this safety gate.
    if (match && HARD_SAFETY_CATEGORIES.has(match.category) && match.confidence >= 0.90) return 'remove';
    return 'review';
  }
  if (riskScore >= DOMINION_POLICY.thresholds.allow) return 'review';
  return 'allow';
}

export function assessDominionContent(input = {}, classifier = classifyWithFallback) {
  const content = normalize(input.content ?? input.text ?? input.caption ?? input.title);
  const source = normalize(input.source || 'app');
  const id = input.id || `DOM-${crypto.randomUUID()}`;

  if (!content) {
    return {
      id,
      source,
      decision: 'review',
      riskScore: 10,
      modelConfidence: 1,
      categoryWeight: 10,
      categories: ['invalid'],
      reasons: ['Content is empty'],
      seals: [],
      processedAt: new Date().toISOString()
    };
  }

  const matches = classifier(content) || [];
  const top = matches
    .map((m) => ({ ...m, weight: Number(m.weight ?? CATEGORY_WEIGHTS[m.category] ?? 0) }))
    .sort((a, b) => (b.confidence * b.weight) - (a.confidence * a.weight))[0];

  const riskScore = top ? Number((top.confidence * top.weight).toFixed(3)) : 0;
  const leadershipDiscourse = detectLeadershipDiscourse(content);
  const seals = leadershipDiscourse ? ['Sovereign Peace'] : [];
  if (matches.some((m) => m.category === 'peace_chaos_conflict')) seals.push('Radiate Peace');

  const decision = decisionFor(riskScore, top);
  const categories = [...new Set(matches.map((m) => m.category))];
  const reasons = top
    ? [`${top.category}: confidence ${top.confidence.toFixed(2)} × weight ${top.weight} = risk ${riskScore.toFixed(3)}`]
    : ['No configured harm signal detected'];

  return {
    id,
    source,
    decision,
    riskScore,
    modelConfidence: top?.confidence ?? 0,
    categoryWeight: top?.weight ?? 0,
    categories,
    reasons,
    seals,
    leadershipDiscourse,
    policy: DOMINION_POLICY.name,
    processedAt: new Date().toISOString()
  };
}

export function buildDominionModerationRecord(input = {}, assessment) {
  return {
    id: assessment.id,
    source: assessment.source,
    content: normalize(input.content ?? input.text ?? input.caption ?? input.title),
    decision: assessment.decision,
    riskScore: assessment.riskScore,
    modelConfidence: assessment.modelConfidence,
    categoryWeight: assessment.categoryWeight,
    categories: assessment.categories,
    reasons: assessment.reasons,
    seals: assessment.seals,
    leadershipDiscourse: assessment.leadershipDiscourse,
    moderatedAt: assessment.processedAt
  };
}
