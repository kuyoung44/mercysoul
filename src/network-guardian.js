/**
 * MercySoul Network Guardian — Device Trace Before Action Mode.
 * Assesses caller-supplied, authorized telemetry only. It does not scan networks,
 * identify people, block devices, or execute actions.
 */
export const DEVICE_TRACE_VERSION = '1.0.0';
const text = value => String(value ?? '').trim().slice(0, 160);

export function assessDeviceTrace(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'JSON object required', mode: 'monitor-only' };
  }
  if (input.authorizedScopeConfirmed !== true) {
    return {
      ok: false,
      engine: 'MercySoul Network Guardian',
      version: DEVICE_TRACE_VERSION,
      mode: 'monitor-only',
      error: 'Confirm that this telemetry belongs to infrastructure you own or are authorized to administer.',
      actionsTaken: [],
      externalMutation: false
    };
  }
  const raw = Array.isArray(input.devices) ? input.devices.slice(0, 100) : [];
  const devices = raw.map((item, index) => {
    const d = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    const signals = Array.isArray(d.signals) ? d.signals.slice(0, 12).map(text).filter(Boolean) : [];
    const verified = d.evidenceVerified === true;
    const elevated = signals.length > 0 || d.trafficSpike === true || d.connectionSpike === true;
    return {
      recordId: text(d.recordId) || `record-${index + 1}`,
      label: text(d.label) || 'Unlabeled device',
      source: text(d.source) || 'unspecified telemetry source',
      observedAt: text(d.observedAt) || null,
      evidenceVerified: verified,
      signals,
      assessment: elevated ? (verified ? 'REVIEW_REQUIRED' : 'UNVERIFIED_SIGNAL') : 'NO_FLAG_FROM_SUPPLIED_DATA',
      rationale: elevated
        ? (verified
          ? 'Supplied telemetry contains a signal requiring human review; this is not proof of malicious activity.'
          : 'A signal was supplied but is not verified; gather corroborating evidence before any response.')
        : 'No listed signal was supplied. This does not establish that the device is safe.'
    };
  });
  return {
    ok: true,
    engine: 'MercySoul Network Guardian',
    version: DEVICE_TRACE_VERSION,
    mode: 'monitor-only',
    scope: 'caller-supplied telemetry from an authorized environment',
    summary: {
      recordsReceived: raw.length,
      reviewRequired: devices.filter(d => d.assessment === 'REVIEW_REQUIRED').length,
      unverifiedSignals: devices.filter(d => d.assessment === 'UNVERIFIED_SIGNAL').length
    },
    devices,
    nextSteps: [
      'Verify the telemetry source, timestamp, device ownership, and authorized scope.',
      'Corroborate unusual traffic with independent logs and known service baselines.',
      'If risk remains credible, propose the smallest reversible protective action for human approval.',
      'After an approved change, test service health and record the outcome.'
    ],
    guardrails: {
      networkScanning: false,
      deviceTakeover: false,
      automaticBlocking: false,
      externalMutation: false,
      humanJudgmentRequired: true,
      approvalRequiredBeforeProtectiveAction: true
    },
    lifecycle: ['OBSERVE', 'VERIFY', 'ASSESS', 'PROTECT_WITH_AUTHORIZATION', 'TEST', 'RECORD'],
    actionsTaken: []
  };
}
export default assessDeviceTrace;
