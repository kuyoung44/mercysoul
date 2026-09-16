import assert from 'node:assert/strict';
import { buildKnowledgeContext, knowledgeEngineStatus } from './knowledge-engine.js';

const context = buildKnowledgeContext({
  context: 'MercySoul context',
  documents: [{ name: 'brief.txt', text: 'Document evidence' }],
  sources: [{ title: 'Official source', text: 'Source evidence' }],
});

assert.match(context, /MercySoul context/);
assert.match(context, /Document evidence/);
assert.match(context, /Source evidence/);

const status = knowledgeEngineStatus();
assert.equal(status.name, 'MercySoul All-in-One Knowledge Engine');
assert.ok(status.capabilities.includes('knowledge mixing'));
assert.deepEqual(status.modes, ['quick', 'deep']);
console.log('All-in-One Knowledge Engine checks passed');
