import assert from 'node:assert/strict';
import { evaluateAlignment, AUTONOMY } from './alignment.js';

assert.equal(evaluateAlignment('generate_art', { authorized: true, customerIntent: true }).decision, AUTONOMY.AUTO);
assert.equal(evaluateAlignment('publish_content', { authorized: true, customerIntent: true }).decision, AUTONOMY.CONFIRM);
assert.equal(evaluateAlignment('delete_customer_data', { authorized: true, customerIntent: true }).decision, AUTONOMY.BLOCK);
assert.equal(evaluateAlignment('generate_art', { authorized: false, customerIntent: true }).decision, AUTONOMY.BLOCK);

console.log('Alignment Core checks passed');
