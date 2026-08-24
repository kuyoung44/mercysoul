/**
 * MercySoul Relationship Context Engine v1.0
 *
 * Visual/social cues are treated as contextual signals only. They never prove
 * identity, friendship, location, online presence, consent, or a relationship.
 * External profile/location data requires explicit user consent.
 */
export const RELATIONSHIP_CONTEXT_POLICY = Object.freeze({
  version: '1.0.0',
  privacyFirst: true,
  inferRelationshipFromVisualSimilarity: false,
  inferOnlinePresence: false,
  inferLocationWithoutConsent: false,
  inferIdentityFromAppearance: false,
  requireExplicitConsentForExternalData: true,
  supportedSignals: [
    'global-vision',
    'gold-light',
    'geometric-interconnection',
    'symbolic-aesthetic',
    'social-connection-ui',
    'privacy-boundary',
    'creative-customization',
    'displayed-status'
  ]
});

export function evaluateRelationshipContext(input = {}) {
  const consent = input.explicitConsent === true;
  const externalDataRequested = input.externalDataRequested === true;
  const locationRequested = input.locationRequested === true;
  const relationshipClaim = input.relationshipClaim === true;
  const onlineClaim = input.onlinePresenceClaim === true;

  const blockedAssumptions = [];
  if (externalDataRequested && !consent) blockedAssumptions.push('external-data-requires-explicit-consent');
  if (locationRequested && !consent) blockedAssumptions.push('location-requires-explicit-consent');
  if (relationshipClaim) blockedAssumptions.push('visual-or-ui-signal-is-not-proof-of-relationship');
  if (onlineClaim) blockedAssumptions.push('displayed-status-is-not-proof-of-independent-online-activity');

  return {
    ok: blockedAssumptions.length === 0,
    policyVersion: RELATIONSHIP_CONTEXT_POLICY.version,
    privacyProtected: true,
    consentGranted: consent,
    blockedAssumptions,
    signals: Array.isArray(input.signals) ? input.signals : [],
    interpretation: 'context-only'
  };
}
