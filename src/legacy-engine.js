/**
 * MERCYSOUL LEGACY ENGINE v1.0.0
 * Keeps the project's legacy visible as structured, durable metadata.
 * This module does not claim permanence by itself; persistence remains the responsibility of the configured store.
 */

const LEGACY = Object.freeze({
  id: 'MERCYSOUL-LEGACY',
  version: '1.0.0',
  status: 'alive',
  principle: 'Build, preserve, prove, teach, evolve.',
  pillars: Object.freeze([
    'creation',
    'preservation',
    'provenance',
    'continuity',
    'service'
  ]),
  continuity: Object.freeze({
    enabled: true,
    appendOnlyIntent: true,
    durablePersistenceRequired: true,
    humanReadable: true
  }),
  declaration: 'What is created with purpose should remain understandable, attributable, and capable of continuing beyond a single release.'
});

export function legacyStatus() {
  return {
    ...LEGACY,
    checkedAt: new Date().toISOString()
  };
}

export function createLegacyRecord({ type = 'milestone', title, description, source = 'mercysoul-os' } = {}) {
  const cleanTitle = String(title || '').trim();
  const cleanDescription = String(description || '').trim();
  if (!cleanTitle || !cleanDescription) {
    return { ok: false, error: 'title and description are required' };
  }

  return {
    ok: true,
    legacy: LEGACY.id,
    record: {
      id: `LEGACY-${Date.now().toString(36)}`,
      type: String(type).trim() || 'milestone',
      title: cleanTitle,
      description: cleanDescription,
      source: String(source).trim() || 'mercysoul-os',
      recordedAt: new Date().toISOString()
    }
  };
}
