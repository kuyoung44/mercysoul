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


## Integrated guarded API mode

The feature branch integrates the policy layer with the existing Express engine routes:

- `GET /api/governance/dominion/status` — reports the active guarded-governance mode and lifecycle pattern.
- `POST /api/governance/dominion/propose` — requires the configured admin bearer token and returns a proposal bound to the exact engine command. Proposal creation does not execute it.
- `POST /api/engine/run` — read-only planning remains available to authenticated admins. When `execute: true`, the request must include the exact returned `governanceProposal` plus an explicit `approval` object with `approved: true`, matching `proposalId` and `scope`, approver, reason, approval reference, and a future `expiresAt`.

The API records proposal and authorization-gate outcomes through the existing best-effort Supabase event path. This does not by itself prove that Supabase persisted the event. The status endpoint deliberately reports the governance helper's audit implementation as non-durable until persistence is independently verified.

### API flow

1. Call `POST /api/governance/dominion/propose` with `{ "command": "...", "owner": "...", "issue": "..." }` using an admin bearer token.
2. Review the returned proposal and exact scope.
3. A human must explicitly approve the exact proposal. Send the proposal and approval record to `POST /api/engine/run` with `execute: true`.
4. The gate checks proposal integrity, scope, required fields, and expiry before passing control to the existing engine.

**Security limitation:** the current integration uses the existing shared `ADMIN_API_TOKEN` as its authentication boundary. The approval object's approver label is not an independent identity proof. Before broad production use, replace this with a trusted approval record issued by a separately authenticated approval workflow, and ensure the approval is single-use/idempotent. Keep the admin token server-side.


## Natural Conversation Mode v1.0

The conversation layer now applies the rule set in `src/natural-conversation-mode.js` and integrates it into `src/agent/personal-bot.js`.

- Common greetings, thanks, acknowledgments, and casual check-ins receive short, natural replies without being routed as tasks.
- The model instructions for substantive requests reinforce proportionate conversation, no unnecessary paraphrasing, focused clarification, and correctly rendered text.
- Conversation-mode status is included in `getGovernanceStatus()` and therefore appears in the Dominion status response.
- Actionable requests continue through the normal assistant path. Natural Conversation Mode does not grant execution authority, bypass scoped approval, or change repository/deployment permissions.
- Unit tests cover classification, example replies, non-interception of actionable requests, and the no-governance-bypass invariant.

Example: `Good evening` → `Good evening! Aṣẹ. What shall we work on tonight?`

This is source-level integration on the feature branch. Runtime behavior and the full test suite must be verified before merge or deployment.
