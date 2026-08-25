import test from 'node:test';
import assert from 'node:assert/strict';
import { adjudicateAccount, getAccountStatus, Rade } from './soul-freeze.js';

test('critical violation assigns a Rade and freezes a client', () => {
  const result = adjudicateAccount(
    { accountId: 'test-client-v6', accountRole: 'client', requestId: 'req-v6' },
    { categories: ['credible_violent_threat'], reasons: ['critical test'], score: 1, confidence: 1 }
  );
  assert.equal(result.suspended, true);
  assert.equal(result.rade, Rade.CREDIBLE_VIOLENT_THREAT);
  assert.equal(getAccountStatus('test-client-v6').soulFreeze, true);
});

test('owner and admin receive the same critical enforcement path', () => {
  for (const role of ['owner', 'admin']) {
    const result = adjudicateAccount(
      { accountId: `test-${role}-v6`, accountRole: role, requestId: `req-${role}` },
      { categories: ['extremist_support'], reasons: ['critical test'], score: 1, confidence: 1 }
    );
    assert.equal(result.suspended, true);
    assert.equal(result.ownerExempt, false);
    assert.equal(result.adminExempt, false);
  }
});
