import crypto from 'node:crypto';
import { evaluateAlignment, AUTONOMY } from './alignment.js';
import { evaluateConstitution } from './governance/constitution.js';

const CONSTITUTION_VERSION = '3.0.0';

export function createArtworkJob(vision, order) {
  if (!vision?.brief) throw new Error('A verified creative brief is required');
  if (order?.status !== 'paid') throw new Error('A paid order is required before creation');

  const intent = String(vision.rawIdea || vision.brief.source || '').trim();
  const constitutional = evaluateConstitution({ intentClear: intent.length > 0, privacyConsent: true, securitySafe: true });
  if (constitutional.decision !== 'allow') return { status: constitutional.decision === 'clarify' ? 'awaiting_confirmation' : 'blocked', constitutional };

  const alignment = evaluateAlignment('generate_art', {
    authorized: order.status === 'paid',
    customerIntent: intent.length > 0,
    humanConfirmation: false
  });

  if (alignment.decision !== AUTONOMY.AUTO) {
    return { status: 'awaiting_confirmation', alignment, constitutional };
  }

  const id = `ART-${crypto.randomUUID()}`;
  return {
    id,
    orderId: order.id,
    visionId: vision.id,
    status: 'ready_for_creation',
    provider: process.env.IMAGE_PROVIDER || 'not_configured',
    prompt: vision.brief.direction,
    brief: vision.brief,
    alignment,
    constitutional,
    mercySoulSignature: {
      signatureId: `MS-${crypto.randomUUID()}`,
      constitutionVersion: CONSTITUTION_VERSION,
      generationId: id,
      createdAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString()
  };
}
