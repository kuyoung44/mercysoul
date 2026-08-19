import crypto from 'node:crypto';
import { moderatePost } from './post-moderator.js';

const MAX_TEXT = 20_000;
const DEFAULT_SOURCE = 'unknown';

function normalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
}

/**
 * Normalize arbitrary web/app content into the same moderation contract.
 * This does not crawl or control the public internet; integrations must
 * submit content here before displaying, publishing, or storing it.
 */
export function moderateWebContent(input = {}) {
  const content = normalize(input.content ?? input.text ?? input.title);
  const source = normalize(input.source || DEFAULT_SOURCE);
  const url = normalize(input.url);
  const moderation = moderatePost({ title: input.title, text: content });

  return {
    id: input.id || `WEB-${crypto.randomUUID()}`,
    source,
    url,
    content,
    decision: moderation.decision,
    score: moderation.score,
    confidence: moderation.confidence,
    categories: moderation.categories,
    reasons: moderation.reasons,
    moderatedAt: new Date().toISOString()
  };
}

export function shouldDisplayWebContent(result) {
  return result?.decision === 'allow';
}
