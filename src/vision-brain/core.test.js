import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyVisionIntent, createVisionPlan } from './core.js';

test('routes software requests to the software build lane', () => {
  assert.equal(classifyVisionIntent('Build an API for my website'), 'software_build');
});
test('routes business requests to the business growth lane', () => {
  assert.equal(classifyVisionIntent('Find customers and improve sales'), 'business_growth');
});
test('routes creative requests to the creative lane', () => {
  assert.equal(classifyVisionIntent('Design a brand logo'), 'creative_work');
});
test('marks consequential actions for human approval and never executes them', () => {
  const plan = createVisionPlan('Deploy the website and publish the announcement');
  assert.equal(plan.approvalRequired, true);
  assert.equal(plan.executionAllowed, false);
  assert.equal(plan.externalMutation, false);
  assert.equal(plan.stages.find((stage) => stage.stage === 'APPROVE').status, 'awaiting_human');
});
test('keeps ordinary planning response-only', () => {
  const plan = createVisionPlan('Help me plan a learning roadmap');
  assert.equal(plan.approvalRequired, false);
  assert.equal(plan.executionAllowed, false);
  assert.equal(plan.externalMutation, false);
});
