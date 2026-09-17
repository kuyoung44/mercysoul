import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuardianEvent } from './event-schema.js';

test('Guardian event rejects protected payload fields', () => {
  const event = createGuardianEvent({
    agentId: 'agent-1',
    ownerId: 'owner-1',
    eventType: 'input_hook',
    title: 'Input hook detected',
    details: { process: 'example', password: 'should-not-be-stored', nested: { token: 'secret' } },
  });

  assert.equal(event.details.password, undefined);
  assert.equal(event.details.nested.token, undefined);
});

test('Guardian event accepts defensive metadata', () => {
  const event = createGuardianEvent({
    agentId: 'agent-1',
    ownerId: 'owner-1',
    eventType: 'process',
    severity: 'medium',
    title: 'Unexpected process',
    details: { pid: 42, executable: 'example.exe' },
  });

  assert.equal(event.details.pid, 42);
  assert.equal(event.severity, 'medium');
});
