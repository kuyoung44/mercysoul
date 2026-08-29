/** MERCYSOUL SOUL-FREEZE VETTING PROTOCOL v16.0
 * A structured interaction-safety filter. It evaluates observable evidence,
 * not a person's unknowable "energy" or character.
 */

export const SOUL_FREEZE_VETTING_PROTOCOL = Object.freeze({
  name: 'Soul-Freeze Vetting Protocol',
  version: '16.0',
  scale: Object.freeze([
    'presentation',
    'energy',
    'context',
    'values',
    'intention'
  ]),
  decisions: Object.freeze({
    curatedShell: 'observe-no-engage',
    emotionalBait: 'freeze-and-review',
    trueAlignment: 'patient-engagement'
  }),
  boundaries: Object.freeze({
    observableEvidenceOnly: true,
    noMindReading: true,
    noAppearanceBasedJudgment: true,
    noAutomaticBlocking: true,
    userAgency: true
  })
});

const normalize = (value) => String(value || '').trim().toLowerCase();

export function soulFreezeStatus() {
  return { ok: true, active: true, protocol: SOUL_FREEZE_VETTING_PROTOCOL };
}

export function evaluateSoulFreeze(input = {}) {
  const message = normalize(input.message || input.content || '');
  const profile = normalize(input.profile || input.context || '');
  const combined = `${message} ${profile}`;
  const manipulationSignals = [
    'send money', 'pay me', 'urgent transfer', 'prove your love',
    'give me your password', 'send code', 'crypto', 'gift card'
  ];
  const matchedManipulationSignals = manipulationSignals.filter((s) => combined.includes(s));
  const explicitBait = matchedManipulationSignals.length > 0;

  const evidence = {
    presentation: input.presentationEvidence || null,
    energy: input.energyEvidence || null,
    context: input.contextEvidence || null,
    values: input.valuesEvidence || null,
    intention: input.intentionEvidence || null
  };

  let decision = 'review';
  if (explicitBait) decision = 'freeze-and-review';
  else if (input.authenticityConfirmed === true) decision = 'patient-engagement';
  else decision = 'observe-no-engage';

  return {
    ok: true,
    decision,
    matchedManipulationSignals,
    evidence,
    reason: explicitBait
      ? 'Potential manipulation or financial/security bait detected; pause before responding.'
      : 'Insufficient evidence for a definitive judgment; observe and preserve user agency.',
    reminder: 'Do not pay for attention, surrender credentials, or chase validation. Verify before engaging.'
  };
}
