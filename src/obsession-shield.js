/** MERCYSOUL OBSESSION SHIELD v8.2.1 */

export const OBSESSION_SHIELD_PROTOCOL = Object.freeze({
  name: 'MercySoul Obsession Shield',
  version: '8.2.1',
  principles: [
    'user-controlled-boundaries',
    'behavior-based-risk',
    'privacy-minimization',
    'reversible-enforcement',
    'no-retaliation'
  ],
  externalPlatformControl: false,
  rawIpRetention: false,
  spiritualClaimEnforcement: false,
  actions: ['allow', 'review', 'freeze', 'user-block', 'pause-and-redirect']
});

function count(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function evaluateObsessionShield(input = {}) {
  const repeatedContacts = count(input.repeatedContacts);
  const unwantedContacts = count(input.unwantedContacts);
  const spamEvents = count(input.spamEvents);
  const threats = count(input.threats);
  const riskScore = Math.min(10, threats * 3 + spamEvents * 1.5 + unwantedContacts * 0.75 + repeatedContacts * 0.25);

  let action = 'allow';
  if (threats > 0 || riskScore >= 7) action = 'freeze';
  else if (riskScore >= 3) action = 'review';

  return {
    protocol: OBSESSION_SHIELD_PROTOCOL.version,
    action,
    riskScore: Number(riskScore.toFixed(2)),
    userBoundary: 'block-or-mute-at-source',
    selfRedirect: 'pause-device-and-redirect-attention',
    retaliation: false,
    note: 'The shield evaluates observable application behavior only; it does not infer spiritual causes or control external platforms.'
  };
}

export function obsessionShieldStatus() {
  return OBSESSION_SHIELD_PROTOCOL;
}
