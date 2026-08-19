import crypto from 'node:crypto';
import { evaluateAlignment, AUTONOMY } from './alignment.js';

export function createArtworkJob(vision, order) {
  if (!vision?.brief) throw new Error('A verified creative brief is required');
  if (order?.status !== 'paid') throw new Error('A paid order is required before creation');

  const intent = String(vision.rawIdea || vision.brief.source || '').trim();
  const alignment = evaluateAlignment('generate_art', {
    authorized: order.status === 'paid',
    customerIntent: intent.length > 0,
    humanConfirmation: false
  });

  if (alignment.decision !== AUTONOMY.AUTO) {
    return { status: 'awaiting_confirmation', alignment };
  }

  return {
    id: `ART-${crypto.randomUUID()}`,
    orderId: order.id,
    visionId: vision.id,
    status: 'queued',
    provider: process.env.IMAGE_PROVIDER || 'not_configured',
    prompt: vision.brief.direction,
    brief: vision.brief,
    alignment,
    createdAt: new Date().toISOString()
  };
}
