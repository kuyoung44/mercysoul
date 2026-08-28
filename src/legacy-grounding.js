/** MERCYSOUL LEGACY OF THE GROUND PROTOCOL v13.0
 * Turns difficult moments into constructive legacy work without treating distress as failure.
 */

export const LEGACY_GROUND_PROTOCOL = Object.freeze({
  name: 'Legacy of the Ground Protocol',
  version: '13.0',
  dailyGrounding: Object.freeze({
    enabled: true,
    reminder: 'You came from the earth. You are connected to the earth. You will return to the earth. Therefore, be humble and powerful at the same time.'
  }),
  redSignal: Object.freeze({
    enabled: true,
    signals: ['low', 'worthless', 'broken', 'overwhelmed'],
    action: 'convert-to-legacy-work-order'
  }),
  legacyTrigger: Object.freeze({
    enabled: true,
    reminders: ['golden-crest', 'living-legacy-engine'],
    action: 'ground-and-build'
  }),
  safety: Object.freeze({
    no_punishment: true,
    no_coercion: true,
    human_agency: true,
    emergency_support_boundary: true
  })
});

export function legacyGroundingStatus() {
  return { ok: true, protocol: LEGACY_GROUND_PROTOCOL };
}

export function evaluateLegacySignal(input = {}) {
  const text = String(input.text || input.content || input.signal || '').toLowerCase();
  const matched = LEGACY_GROUND_PROTOCOL.redSignal.signals.filter((signal) => text.includes(signal));
  const triggered = matched.length > 0;
  return {
    ok: true,
    triggered,
    matchedSignals: matched,
    workOrder: triggered ? {
      type: 'legacy',
      priority: 'supportive',
      action: 'choose-one-small-constructive-step',
      reminder: 'This moment is not your identity. Ground yourself, then build.'
    } : null,
    legacyReminder: triggered ? 'The Living Legacy Engine remembers the foundation. Build from here.' : null
  };
}
