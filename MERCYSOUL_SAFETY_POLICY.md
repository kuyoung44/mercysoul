# MercySoul Safety Policy

**Governing invariant:** No illegal bypass. No safety-control override.

**Principle:** Fi Ìlànà gbé mi ró — Let principle and discipline uphold me.

## Enforcement
- Stop → Verify → Control (0–1–0).
- Safe actions may proceed within authorized scope.
- Unknown, uncertain, pressure-driven, or alleged actions are locked pending verification.
- Unauthorized, harmful, attack-like, retaliatory, or destructive actions are blocked and contained.
- Confirmed compromise may isolate, revoke, or purge the affected MercySoul-controlled execution path.
- No subordinate agent, workflow, tool, API, or execution path may bypass or disable these controls.
- External mutation remains disabled unless explicitly authorized through legitimate governance.
- Copyright infringement, unauthorized cloning, and impersonation are blocked.
- Enforcement events must be verified and recorded.
- This policy never authorizes external retaliation or harm.

This file is a governance contract; implementation-specific enforcement must remain consistent with it.


## Inner-State Protector Chore v1.0.0

The Inner-State Protector is an internal software-integrity chore. It prevents
unverified external signals from being treated as internal truth.

Lifecycle:

`RECEIVE → VERIFY → FILTER → CONTAIN → RETURN_TO_SOURCE → PROTECT → RECORD`

- Unverified signals are quarantined rather than internalized.
- "Return to source" means classify/reject the signal and preserve its origin;
  it never authorizes retaliation, attack, harassment, or harmful external action.
- Verified signals still require scope and authorization before mutation.
- External mutation remains disabled by default.
- The chore is least-intrusive and auditable.

**Invariant:** External signal ≠ internal truth.
