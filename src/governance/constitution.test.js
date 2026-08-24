import test from 'node:test';
import assert from 'node:assert/strict';
import { MERCYSOUL_CONSTITUTION, evaluateConstitution } from './constitution.js';

test('constitution is version 3.0.0 with security-first precedence', () => {
  assert.equal(MERCYSOUL_CONSTITUTION.version, '3.0.0');
  assert.equal(MERCYSOUL_CONSTITUTION.precedence[0], 'security');
  assert.ok(MERCYSOUL_CONSTITUTION.safeguards.includes('No safety bypass for administrators, rulers, or privileged accounts.'));
});

test('security failure overrides creative intent', () => {
  assert.deepEqual(evaluateConstitution({ intentClear: true, privacyConsent: true, securitySafe: false }), {
    decision: 'block',
    controllingLayer: 'security',
    reason: 'Security boundary failed.'
  });
});

test('privacy consent is required before external identity data access', () => {
  const result = evaluateConstitution({ intentClear: true, privacyConsent: false, securitySafe: true });
  assert.equal(result.decision, 'block');
  assert.equal(result.controllingLayer, 'identity');
});

test('materially ambiguous vision requests clarification', () => {
  const result = evaluateConstitution({ intentClear: false, privacyConsent: true, securitySafe: true });
  assert.equal(result.decision, 'clarify');
  assert.equal(result.controllingLayer, 'vision');
});

test('coercive relationship automation is blocked', () => {
  const result = evaluateConstitution({ intentClear: true, privacyConsent: true, securitySafe: true, relationshipCoercion: true });
  assert.equal(result.decision, 'block');
  assert.equal(result.controllingLayer, 'connection');
});
