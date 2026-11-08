/**
 * Fail-closed execution gate for orchestration.
 * Provider mutations remain disabled until a scoped approval handoff is
 * implemented and independently verified by the execution adapter.
 */
export function evaluateExecutionGate(plan, body = {}) {
  if (plan?.requiresApproval === true) {
    return {
      allowed: false,
      status: 202,
      execution: 'approval-required',
      approvalRequired: true,
      executionPerformed: false,
      reason: 'Provider mutations require a scoped human approval record.',
    };
  }

  if (body?.execute !== true) {
    return {
      allowed: false,
      status: 202,
      execution: 'plan-only',
      approvalRequired: false,
      executionPerformed: false,
      reason: 'Explicit execute: true is required even for read-only provider checks.',
    };
  }

  return {
    allowed: true,
    status: 200,
    execution: 'read-only-execution',
    approvalRequired: false,
    executionPerformed: false,
    reason: 'Only a command classified as explicitly read-only may proceed.',
  };
}
