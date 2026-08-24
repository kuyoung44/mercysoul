import crypto from 'node:crypto';
import { moderatePost } from './post-moderator.js';
import { moderateWebContent } from './web-moderation-gateway.js';
import { DOMINION_POLICY } from './dominion-moderation.js';

const VERSION = '1.1.0';
const startedAt = new Date().toISOString();

const modules = {
  security: { status: 'ready', responsibilities: ['headers', 'rate-limit', 'admin-auth'] },
  moderation: { status: 'ready', responsibilities: ['post', 'web', 'risk-score', 'review', 'remove'] },
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
    dominion: DOMINION_POLICY,
    policy: {
      moderationDecisions: ['allow', 'review', 'remove'],
      publicInternetControl: false,
      connectedSourceControl: true,
      humanReviewForAmbiguous: true,
      politicalViewpointNeutrality: true
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
    riskScore: result.riskScore ?? result.score,
    confidence: result.confidence,
    categoryWeight: result.categoryWeight ?? 0,
    categories: result.categories,
    reasons: result.reasons,
    seals: result.seals || [],
    leadershipDiscourse: result.leadershipDiscourse === true,
    processedAt: new Date().toISOString()
  };
}
