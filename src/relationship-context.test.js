import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRelationshipContext } from './relationship-context.js';

test('does not infer a relationship from visual or social UI signals', () => {
  const result = evaluateRelationshipContext({
    signals: ['social-connection-ui', 'displayed-status'],
    relationshipClaim: true,
    onlinePresenceClaim: true
  });
  assert.equal(result.ok, false);
  assert.equal(result.privacyProtected, true);
  assert.ok(result.blockedAssumptions.includes('visual-or-ui-signal-is-not-proof-of-relationship'));
  assert.ok(result.blockedAssumptions.includes('displayed-status-is-not-proof-of-independent-online-activity'));
});

test('requires explicit consent for external and location data', () => {
  const result = evaluateRelationshipContext({
    externalDataRequested: true,
    locationRequested: true,
    explicitConsent: false
  });
  assert.equal(result.ok, false);
  assert.equal(result.consentGranted, false);
  assert.equal(result.blockedAssumptions.length, 2);
});

test('explicit consent permits requested data context without proving identity', () => {
  const result = evaluateRelationshipContext({
    externalDataRequested: true,
    locationRequested: true,
    explicitConsent: true,
    signals: ['global-vision', 'geometric-interconnection']
  });
  assert.equal(result.ok, true);
  assert.equal(result.interpretation, 'context-only');
});
