# MercySoul Dominion Governance Engine v1

This module adds an isolated, side-effect-free governance policy layer to MercySoul OS. It does not replace existing routes, agent flows, database schemas, deployment configuration, or homepage behavior.

## Invariants

- **No authority by assertion:** a project or identity reference is not permission.
- **Default deny:** incomplete requests are blocked from authorization.
- **Explicit human approval:** mutations require a proposal-bound approval, matching scope, approver identity, reason, reference, and unexpired timestamp.
- **No execution in this module:** even a valid approval result is a handoff signal, never proof that an external action occurred.
- **Least authority:** external permissions must be independently verified by the execution adapter.
- **Human judgment required:** the engine surfaces checks and reasons; it does not claim religious, legal, or unquestionable authority.
- **Auditable decisions:** audit helpers create SHA-256 chained entries and detect edits to an individual entry.
- **Truthful persistence claims:** the included audit helper is in-memory and does not claim durable database persistence.

## Lifecycle

`RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD`

This release implements proposal evaluation, approval validation, governance status, and audit-entry helpers. It intentionally does not implement EXECUTE, provider adapters, database writes, deployment changes, or automatic approval.

## Use

```js
import {
  evaluateRequest,
  authorizeProposal,
  appendAudit,
  verifyAuditEntry,
} from "./dominion-governance-engine.js";

const proposal = evaluateRequest({
  action: "deploy",
  scope: "preview deployment for PR 12",
  owner: "maintainer",
  issue: "PR-12",
  repoPermission: true,
  externalMutation: true,
});

// This validation never executes the deployment.
const gate = authorizeProposal(proposal, approvalRecord);
if (!gate.authorized) {
  // Stop, explain reasons, and request authorized human review.
}

const auditEntry = appendAudit(null, {
  eventType: "approval_checked",
  actor: "guardian",
  outcome: gate.authorized ? "authorized_for_handoff" : "denied",
});
if (!verifyAuditEntry(auditEntry)) throw new Error("Audit integrity check failed");
```

Approval records must be obtained through a trusted, authenticated human approval channel. Do not accept approval identity, permission claims, or approval state from untrusted request-body fields alone. A production adapter must re-authenticate the approver, independently verify current permissions and target state, enforce idempotency and expiry, persist audit events durably, and record provider-confirmed outcomes.

## Validation

`npm test` runs the unit tests alongside existing tests. This feature branch does not change the package scripts or add dependencies.

## Deployment and permissions

No production deployment is triggered by this module. No database, secret, permission, repository setting, existing project, or external service is modified by the runtime code in this feature. Merge and deployment remain separate human decisions.
