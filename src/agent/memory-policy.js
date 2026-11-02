import crypto from 'node:crypto';

/**
 * MercySoul persistent-memory policy layer.
 *
 * Inspired by the progressive-disclosure and session-continuity patterns in
 * claude-mem, but intentionally provider-neutral. This module prepares and
 * filters candidate memories; it does not persist data or access external tools.
 */

const MAX_TEXT = 4000;
const MAX_TAGS = 12;
const SENSITIVE_PATTERNS = [
  /\b(api[_ -]?key|secret|password|passwd|token|bearer|private[_ -]?key)\b\s*[:=]\s*\S+/i,
  /\bsk-[A-Za-z0-9_-]{12,}\b/,
  /\b\d{10,}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
];

const ALLOWED_TYPES = new Set([
  'decision', 'preference', 'project_fact', 'task', 'lesson', 'summary'
]);

function cleanText(value) {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, MAX_TEXT);
}

function containsSensitiveMaterial(value) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Return a memory candidate only when the user has allowed retention and the
 * content passes basic secret/PII screening. Sensitive content is rejected,
 * not partially redacted and silently retained.
 */
export function prepareMemoryObservation(input = {}) {
  const content = cleanText(input.content);
  const type = String(input.type || '').trim().toLowerCase();
  const userOptIn = input.userOptIn === true;
  const privateMarked = input.private === true || /<private>[\s\S]*?<\/private>/i.test(content);

  if (!userOptIn) return { stored: false, reason: 'user_opt_in_required' };
  if (privateMarked) return { stored: false, reason: 'private_content_excluded' };
  if (!content) return { stored: false, reason: 'empty_content' };
  if (!ALLOWED_TYPES.has(type)) return { stored: false, reason: 'unsupported_memory_type' };
  if (containsSensitiveMaterial(content)) return { stored: false, reason: 'sensitive_content_excluded' };

  const tags = Array.isArray(input.tags)
    ? [...new Set(input.tags.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean))].slice(0, MAX_TAGS)
    : [];

  return {
    stored: true,
    observation: {
      id: crypto.randomUUID(),
      type,
      content,
      tags,
      projectId: cleanText(input.projectId).slice(0, 120) || null,
      source: cleanText(input.source).slice(0, 80) || 'user-provided',
      createdAt: new Date().toISOString(),
      retention: input.retention === 'session' ? 'session' : 'durable',
      provenance: 'explicit-user-approved',
    },
  };
}

/**
 * Progressive disclosure: first return compact index cards; callers may then
 * request full observations by ID. This function does not fetch or persist.
 */
export function buildMemoryIndex(observations = [], { limit = 10 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  return (Array.isArray(observations) ? observations : [])
    .filter((item) => item && typeof item.id === 'string' && typeof item.content === 'string')
    .slice(0, safeLimit)
    .map((item) => ({
      id: item.id,
      type: item.type,
      preview: item.content.slice(0, 180),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, MAX_TAGS) : [],
      createdAt: item.createdAt || null,
      projectId: item.projectId || null,
    }));
}

export function selectMemoryObservations(observations = [], ids = []) {
  const wanted = new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : []);
  return (Array.isArray(observations) ? observations : [])
    .filter((item) => item && wanted.has(item.id))
    .map((item) => ({ ...item }));
}

export function memoryPolicyStatus() {
  return {
    enabled: true,
    persistence: 'not_configured',
    userOptInRequired: true,
    privateContentExcluded: true,
    sensitiveContentScreening: true,
    progressiveDisclosure: ['index', 'full_observations'],
    externalMutation: false,
  };
}
