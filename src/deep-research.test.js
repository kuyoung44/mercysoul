import assert from 'node:assert/strict';
import { deepResearchStatus } from './deep-research.js';

const status = deepResearchStatus();
assert.equal(status.provider, 'Google Gemini + Google Search grounding');
assert.deepEqual(status.modes, ['quick', 'deep']);
assert.match(status.architecture, /verification/);
console.log('Deep Research Engine checks passed');
