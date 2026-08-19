const RULES = [
  { category: 'sexual_exploitation', action: 'block', patterns: [/child\s*(sexual|porn|nude)/i, /minor\s*(sexual|porn|nude)/i, /sexual\s*exploitation/i] },
  { category: 'violent_threat', action: 'review', patterns: [/\b(i will|we will|going to)\s+(kill|murder|shoot)\b/i, /\bkill you\b/i] },
  { category: 'non_consensual_sexual', action: 'block', patterns: [/non[- ]consensual\s+sex/i, /sexual\s+assault/i, /rape\b/i] },
  { category: 'extremist_support', action: 'review', patterns: [/terrorist\s+propaganda/i, /join\s+(the|our)\s+terrorist/i] },
  { category: 'spam', action: 'review', patterns: [/(.)\1{8,}/i, /(?:buy|click|dm)\s+(now|immediately)/i] }
];

const BLOCKED_CATEGORIES = new Set(['sexual_exploitation', 'non_consensual_sexual']);

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function moderatePost(input = {}) {
  const text = normalize(input.text ?? input.content ?? input.caption);
  const title = normalize(input.title);
  const combined = `${title} ${text}`.trim();

  if (!combined) {
    return { decision: 'review', score: 1, confidence: 1, reasons: ['Post content is empty'], categories: ['invalid'], normalizedText: combined };
  }

  const matches = [];
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(combined))) {
      matches.push({ category: rule.category, action: rule.action });
    }
  }

  const categories = [...new Set(matches.map((m) => m.category))];
  if (matches.some((m) => BLOCKED_CATEGORIES.has(m.category))) {
    return { decision: 'block', score: 100, confidence: 0.99, reasons: categories.map((c) => `Matched safety rule: ${c}`), categories, normalizedText: combined };
  }
  if (matches.length) {
    return { decision: 'review', score: 60 + Math.min(matches.length * 10, 30), confidence: 0.85, reasons: categories.map((c) => `Requires moderator review: ${c}`), categories, normalizedText: combined };
  }

  return { decision: 'allow', score: 0, confidence: 0.92, reasons: [], categories: [], normalizedText: combined };
}

export function buildModeratorPost(input = {}, moderation) {
  return {
    id: input.id || `POST-${crypto.randomUUID()}`,
    text: normalize(input.text ?? input.content ?? input.caption),
    decision: moderation.decision,
    moderationScore: moderation.score,
    moderationConfidence: moderation.confidence,
    categories: moderation.categories,
    reasons: moderation.reasons,
    moderatedAt: new Date().toISOString()
  };
}
