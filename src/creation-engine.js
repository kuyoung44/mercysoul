import { evaluateAlignment, AUTONOMY } from './alignment.js';

export function createArtworkJob(vision, order) {
  if (!vision?.brief) throw new Error('A verified creative brief is required');
  if (order?.status !== 'paid') throw new Error('A paid order is required before creation');

  const alignment = evaluateAlignment('generate_art', {
    authorized: true,
    customerIntent: true
  });

  if (alignment.decision !== AUTONOMY.AUTO) {
    return { status: 'awaiting_confirmation', alignment };
  }

  return {
    id: `ART-${crypto.randomUUID()}`,
    orderId: order.id,
    status: 'queued',
    provider: process.env.IMAGE_PROVIDER || 'not_configured',
    prompt: vision.brief.direction,
    brief: vision.brief,
    alignment,
    createdAt: new Date().toISOString()
  };
}
