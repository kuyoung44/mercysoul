import crypto from 'node:crypto';
import { moderatePost } from './post-moderator.js';
import { moderateWebContent } from './web-moderation-gateway.js';

const VERSION = '1.0.0';
const startedAt = new Date().toISOString();

const modules = {
  security: { status: 'ready', responsibilities: ['headers', 'rate-limit', 'admin-auth'] },
  moderation: { status: 'ready', responsibilities: ['post', 'web', 'review', 'block'] },
  vision: { status: 'ready', responsibilities: ['verification', 'creative-brief'] },
  alignment: { status: 'ready', responsibilities: ['authorization', 'intent'] },
  creation: { status: 'ready', responsibilities: ['creative-pipeline'] },
  persistence: { status: 'ready', responsibilities: ['durable-store', 'audit'] }
};

export function osStatus() {
  return {
    id: 'MERCYSOUL-OS',
    coreVersion: VERSION,
    runtime: 'node',
    startedAt,
    modules,
    policy: {
      moderationDecisions: ['allow', 'review', 'block'],
      publicInternetControl: false,
      connectedSourceControl: true,
      humanReviewForAmbiguous: true
    }
  };
}

export function processInput(input = {}) {
  const type = input.type || 'post';
  const id = input.id || crypto.randomUUID();
  const result = type === 'web'
    ? moderateWebContent({ ...input, id })
    : moderatePost({ ...input, id });

  return {
    id,
    type,
    decision: result.decision,
    score: result.score,
    confidence: result.confidence,
    categories: result.categories,
    reasons: result.reasons,
    processedAt: new Date().toISOString()
  };
}
