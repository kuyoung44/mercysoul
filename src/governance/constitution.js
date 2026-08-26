import { evaluateEmotionalShield, EMOTIONAL_SHIELD_PROTOCOL } from '../emotional-shield.js';

export const MERCYSOUL_CONSTITUTION = Object.freeze({
  name: 'MercySoul Dominion Constitution',
  version: '4.0.0',
  motto: 'One Vision, Many Connections, Governed by Privacy, Security, Peace, and Human-Centered Intelligence.',
  effective: '2026-08-26',
  precedence: ['security', 'privacy', 'identity', 'connection', 'peace', 'vision', 'creation'],
  layers: Object.freeze({
    vision: { rule: "The user's intention is the highest creative command.", law: 'VisionBrain determines whether intent is sufficiently clear and safe; material ambiguity triggers clarification.' },
    identity: { rule: "The user's identity is sacred.", law: 'No external data, location, or social profile is accessed, stored, or shared without explicit consent. Visual similarity is not evidence of connection.' },
    connection: { rule: "The user's connections remain their own.", law: 'The system facilitates honest, respectful interaction and never forces, manipulates, or exploits relationships.' },
    peace: { rule: 'Peace is protected through respectful, evidence-based moderation.', law: 'Provocation, insults, harassment, manipulation, and threats may trigger proportionate warning, review, or temporary access restriction based on observable behavior. Intent is not assumed with certainty.' },
    security: { rule: 'The ruler is bound by the same laws as citizens.', law: 'No privileged bypass exists. Auto Metric moderation, privacy boundaries, security validation, and the Emotional Shield apply equally to every actor.' },
    creation: { rule: 'Creation should be unique, authentic, and aligned with the user’s intended outcome.', law: 'Generated artwork receives a traceable MercySoul Signature as metadata; the signature does not silently alter the artwork.' }
  }),
  emotionalShield: Object.freeze({
    protocol: EMOTIONAL_SHIELD_PROTOCOL.name,
    version: EMOTIONAL_SHIELD_PROTOCOL.version,
    protectedBehaviors: ['provocation', 'insults', 'harassment', 'manipulation', 'threats'],
    actions: ['allow', 'warn', 'review', 'temporary-freeze'],
    permanentAutomaticBan: false,
    permanentRecord: false,
    noRetaliation: true,
    humanReviewForAmbiguous: true,
    equalTreatment: true
  }),
  safeguards: Object.freeze([
    'Security and privacy override conflicting lower-priority creative goals.',
    'No safety bypass for administrators, rulers, or privileged accounts.',
    'No political viewpoint suppression or special political immunity.',
    'No relationship manipulation or coercive automation.',
    'Emotional Shield enforcement is proportional, evidence-based, reversible, and subject to review.',
    'No permanent account penalty is assigned solely from an automated Emotional Shield signal.',
    'Human review remains available where ambiguity materially affects safety, privacy, or outcome.',
    'MercySoul controls only services and infrastructure it operates; it cannot impose rules on external platforms.'
  ])
});

export function constitutionStatus() {
  return {
    name: MERCYSOUL_CONSTITUTION.name,
    version: MERCYSOUL_CONSTITUTION.version,
    effective: MERCYSOUL_CONSTITUTION.effective,
    precedence: [...MERCYSOUL_CONSTITUTION.precedence],
    emotionalShield: MERCYSOUL_CONSTITUTION.emotionalShield,
    safeguards: [...MERCYSOUL_CONSTITUTION.safeguards]
  };
}

export function evaluateConstitution({ intentClear = true, privacyConsent = true, securitySafe = true, relationshipCoercion = false, emotionalShield = {} } = {}) {
  if (!securitySafe) return { decision: 'block', controllingLayer: 'security', reason: 'Security boundary failed.' };
  if (!privacyConsent) return { decision: 'block', controllingLayer: 'identity', reason: 'Explicit privacy consent is required.' };
  if (relationshipCoercion) return { decision: 'block', controllingLayer: 'connection', reason: 'Coercive relationship behavior is prohibited.' };
  const emotional = evaluateEmotionalShield(emotionalShield);
  if (emotional.action === 'temporary-freeze') return { decision: 'temporary-freeze', controllingLayer: 'peace', reason: 'High-risk observable behavior requires temporary access restriction and review.', emotionalShield: emotional };
  if (emotional.action === 'review') return { decision: 'review', controllingLayer: 'peace', reason: 'Potentially harmful interpersonal behavior requires review.', emotionalShield: emotional };
  if (emotional.action === 'warn') return { decision: 'warn', controllingLayer: 'peace', reason: 'Respectful interaction boundary reached.', emotionalShield: emotional };
  if (!intentClear) return { decision: 'clarify', controllingLayer: 'vision', reason: 'Materially ambiguous intent requires clarification.' };
  return { decision: 'allow', controllingLayer: 'vision', reason: 'Constitutional prerequisites satisfied.', emotionalShield: emotional };
}
