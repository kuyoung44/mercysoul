# MercySoul Host Provisioning Control Plane v1

Status: implementation contract only; this document does not create provider resources.

## Initial scope
- Provider: Vercel only.
- Source: explicitly selected GitHub repository and branch.
- Default mode: read-only plan.
- First operation: one named project per request.
- Domain purchases, DNS changes, billing changes, and production environment changes are excluded unless separately scoped and approved.

## Command shape
```json
{
  "command": "host.provision",
  "mode": "plan",
  "project": "example-project",
  "repository": "owner/repository",
  "branch": "main",
  "provider": "vercel"
}
```

Execution requires authenticated human approval bound to the exact plan digest. Any plan change invalidates approval.

## Required lifecycle
RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD

1. Validate project, repository, branch, provider allowlist, and operation scope.
2. Verify caller identity and actual repository/provider permissions.
3. Produce a deterministic plan with resource changes, cost implications, required configuration, and recovery steps.
4. Apply Guardian checks for least privilege, security, privacy, idempotency, and production impact.
5. Require explicit approval for the exact plan; no approval means no mutation.
6. Execute only through a scoped Vercel adapter. Never log or return secrets.
7. Read back provider state and verify deployment health; API success alone is insufficient.
8. On partial failure, stop further changes and record completed and failed operations. Do not run destructive cleanup automatically.
9. Persist an audit record with actor, request ID, plan digest, approval ID, operation results, verification, and timestamps.

## Invariants
- Plan mode never mutates external state.
- Fail closed if authentication, authorization, audit persistence, or verification is unavailable.
- Use idempotency keys and inspect existing resources before creation.
- Reject arbitrary providers and unvalidated operation targets.
- Do not change permissions, billing, domains, DNS, or production configuration implicitly.
- Human judgment remains required for consequential actions.

## Acceptance tests
- Unauthenticated execution is rejected.
- Plan mode causes no provider mutation.
- Invalid identifiers and unsupported providers are rejected.
- Missing, stale, or mismatched approval is rejected.
- Duplicate requests are idempotent.
- Provider and audit failures stop execution safely.
- Secrets never appear in responses or logs.
- Completion is reported only after resource state and deployment health are verified.

## Implementation sequence
1. Add the contract and tests alongside MercySoul Engine.
2. Implement read-only Vercel discovery and deterministic plans.
3. Bind approval to the plan and integrate durable audit.
4. Implement project creation behind the adapter after tests pass.
5. Verify deployment health.
6. Enable production execution only after review and explicit target-specific authorization.

This is a staged v1 design, not a claim that any host has already been provisioned.