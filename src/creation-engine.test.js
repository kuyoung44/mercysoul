import assert from 'node:assert/strict';
import { createArtworkJob } from './creation-engine.js';

const vision = { id: 'VIS-test', rawIdea: 'A cinematic MercySoul artwork', brief: { direction: 'Create a cinematic MercySoul artwork.' } };
const paid = { id: 'ORD-test', status: 'paid' };

const job = createArtworkJob(vision, paid);
assert.equal(job.status, 'ready_for_creation');
assert.equal(job.orderId, paid.id);
assert.equal(job.alignment.decision, 'auto');
assert.equal(job.constitutional.decision, 'allow');
assert.equal(job.mercySoulSignature.constitutionVersion, '3.0.0');
assert.equal(job.mercySoulSignature.generationId, job.id);
assert.match(job.mercySoulSignature.signatureId, /^MS-/);

assert.throws(() => createArtworkJob(vision, { id: 'ORD-unpaid', status: 'pending_payment' }));
console.log('Creation Engine checks passed');
