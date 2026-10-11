# MercySoul Identity, Verification & Authorization Gate v1.0

Status: blueprint and reusable policy module; not yet enforced across every route or deployed service.

## Governing rule

Identity alone does not grant authority. Every protected action must be authorized against a trusted server-side principal, an exact resource, an exact action, and current policy. Missing, invalid, stale, or contradictory evidence means deny.

## Required lifecycle

RECEIVE -> VERIFY IDENTITY -> VERIFY AUTHORITY -> CHECK RISK -> APPROVE -> EXECUTE -> VERIFY RESULT -> RECORD.

## Gate requirements

1. Authentication is established by the server's configured identity provider/session middleware. Never trust identity, role, permission, or approval fields supplied in a request body.
2. Identity verification status and subject identifier must originate from trusted server-side claims or a verified identity workflow.
3. Permissions are exact `resource:action` grants. No implicit wildcard, owner assumption, or privilege escalation.
4. Consequential actions (deploy, delete, transfer, permission change, credential rotation, production configuration change) require an explicit approval scoped to the same subject, resource, and action, with an expiry.
5. If the identity provider, authorization store, approval store, or policy cannot be checked, protected actions fail closed.
6. After execution, verify the actual result and append an audit event. Never store passwords, access tokens, BVNs, private keys, or full payment credentials in audit logs.
7. Human judgment remains required for consequential actions. The gate does not independently authorize external mutations.

## Integration contract

- Call `authorizeAction` only in server-side code after authentication middleware has populated a trusted principal.
- Derive the resource and action from the route/operation being executed, not from untrusted client-supplied authorization fields.
- Use a durable, server-side approval store with atomic single-use consumption to prevent replay. The pure evaluator validates approval scope and expiry but does not consume approval tokens.
- Attach the decision to structured audit logging. Avoid logging secrets or unnecessary personal data.
- Add integration tests for each protected route before enabling enforcement.

## Current scope and limitations

This change establishes a reusable evaluator, tests, and policy documentation. It does not automatically protect existing API routes, change identity-provider settings, migrate database policies, or deploy to Vercel. Route-by-route integration must be reviewed and tested separately.
