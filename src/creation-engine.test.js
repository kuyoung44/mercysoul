import assert from 'node:assert/strict';
import { createArtworkJob } from './creation-engine.js';

const vision = { id: 'VIS-test', brief: { direction: 'Create a cinematic MercySoul artwork.' } };
const paid = { id: 'ORD-test', status: 'paid' };

const job = createArtworkJob(vision, paid);
assert.equal(job.status, 'queued');
assert.equal(job.orderId, paid.id);
assert.equal(job.alignment.decision, 'auto');

assert.throws(() => createArtworkJob(vision, { id: 'ORD-unpaid', status: 'pending_payment' }));
console.log('Creation Engine checks passed');
