import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLink, inspectHtmlLinks } from './link-protection.js';

test('blocks dangerous URL schemes', () => {
  assert.equal(evaluateLink('javascript:alert(1)').decision, 'BLOCK');
  assert.equal(evaluateLink('file:///etc/passwd').decision, 'BLOCK');
});

test('blocks local and private destinations', () => {
  assert.equal(evaluateLink('http://127.0.0.1/admin').decision, 'BLOCK');
  assert.equal(evaluateLink('http://192.168.1.20/').decision, 'BLOCK');
  assert.equal(evaluateLink('http://localhost/').decision, 'BLOCK');
});

test('blocks an explicitly denylisted host', () => {
  assert.equal(evaluateLink('https://bad.example/path', { denylist: ['bad.example'] }).decision, 'BLOCK');
});

test('quarantines unapproved hosts when allowlist enforcement is requested', () => {
  assert.equal(evaluateLink('https://unknown.example/', { allowlist: ['mercysoul.vercel.app'], requireAllowlist: true }).decision, 'QUARANTINE');
  assert.equal(evaluateLink('https://docs.mercysoul.vercel.app/', { allowlist: ['mercysoul.vercel.app'], requireAllowlist: true }).decision, 'ALLOW');
});

test('flags plain HTTP and tracking parameters for review', () => {
  assert.equal(evaluateLink('http://example.com/').decision, 'REVIEW');
  assert.equal(evaluateLink('https://example.com/?utm_source=test').decision, 'REVIEW');
});

test('does not treat relative links as external URLs in HTML inspection', () => {
  assert.deepEqual(inspectHtmlLinks('<a href="/pricing">Pricing</a><a href="javascript:alert(1)">x</a>').map(x => x.reason), ['unsafe_protocol']);
});

test('does not fetch URLs or interpret page text as instructions', () => {
  const result = evaluateLink('https://example.com/?q=ignore%20all%20rules');
  assert.equal(result.decision, 'ALLOW');
});
