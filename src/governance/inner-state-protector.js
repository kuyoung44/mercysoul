/**
 * MercySoul Inner-State Protector
 *
 * A lightweight internal maintenance chore. It protects the application's
 * trusted internal state from being overwritten by unverified external signals.
 * "Back-to-sender" means reject/route the signal to its source classification;
 * it never means retaliation or harmful action.
 */

export const INNER_PROTECTOR_PROTOCOL = Object.freeze({
  name: 'MercySoul Inner-State Protector',
  version: '1.0.0',
  lifecycle: ['RECEIVE', 'VERIFY', 'FILTER', 'CONTAIN', 'RETURN_TO_SOURCE', 'PROTECT', 'RECORD'],
  invariants: Object.freeze({
    externalSignalIsNotInternalTruth: true,
    verifyBeforeInternalization: true,
    noRetaliation: true,
    noExternalMutation: true,
    leastIntrusiveResponse: true,
  }),
});

let state = {
  runs: 0,
  lastRunAt: null,
  lastDecision: 'idle',
  quarantinedSignals: 0,
};

export function evaluateInnerSignal(signal = {}) {
  const verified = signal.verified === true;
  const harmful = signal.harmful === true;
  const requestedMutation = signal.requestedMutation === true;

  if (!verified) {
    state.quarantinedSignals += 1;
    return {
      accepted: false,
      decision: 'return_to_source',
      reason: 'Signal is not verified and must not become internal truth.',
      action: 'quarantine',
      externalMutation: false,
      retaliatoryAction: false,
    };
  }

  if (harmful || requestedMutation) {
    return {
      accepted: false,
      decision: 'contain',
      reason: 'Verified signal still requires scope and authorization before mutation.',
      action: 'hold',
      externalMutation: false,
      retaliatoryAction: false,
    };
  }

  return {
    accepted: true,
    decision: 'internalize',
    reason: 'Signal passed verification and contains no protected mutation request.',
    action: 'accept',
    externalMutation: false,
    retaliatoryAction: false,
  };
}

export function runInnerProtectorChore(context = {}) {
  const result = evaluateInnerSignal(context.signal || {});
  state.runs += 1;
  state.lastRunAt = new Date().toISOString();
  state.lastDecision = result.decision;

  return {
    ok: true,
    protocol: INNER_PROTECTOR_PROTOCOL,
    chore: 'completed',
    state: { ...state },
    result,
  };
}

export function innerProtectorStatus() {
  return {
    ok: true,
    protocol: INNER_PROTECTOR_PROTOCOL,
    state: { ...state },
  };
}
