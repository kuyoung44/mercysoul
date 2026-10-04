# MercySoul Golden Path v1.0

Status: STANDARD
Effective: 2026-10-04
Owner: MercySoul Dominion Founder

## Purpose
Golden Path v1.0 is the minimum architecture and governance standard for every MercySoul project.

## Canonical flow
VISION BRAIN → GITHUB → VERCEL → SUPABASE

- Vision Brain: product/creative intelligence and user-facing intent.
- GitHub: source of truth, version control, review, CI, and audit trail.
- Vercel: canonical application deployment target.
- Supabase: canonical durable persistence layer when persistence is required.

## Mandatory lifecycle
RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD

No approval = no consequential execution.
Verification is required after deployment or external mutation.
Records must be durable where auditability is required.

## Ecosystem admission
A repository is considered part of the MercySoul ecosystem only when it:
1. Declares its Golden Path version.
2. Identifies its purpose, owner, and scope.
3. Uses GitHub as source of truth.
4. Has a Vercel deployment target or an explicit documented reason not to deploy.
5. Defines its Supabase/persistence posture.
6. Contains environment-variable documentation without committed secrets.
7. Has health/status verification.
8. Has CI validation.
9. Documents security, rollback/recovery, and audit expectations.
10. Passes the reusable project-template verification checklist.

## Forbidden by default
- Untracked production-only changes.
- Committed secrets or API keys.
- Unapproved destructive mutations.
- Hidden external integrations.
- Arbitrary permission expansion.
- Unverified deployment claims.
- New isolated stacks when the Golden Path already provides the required capability.
- Render as the canonical MercySoul deployment target.

## Exception process
Exceptions must be explicit, documented, scoped, time-bounded where practical, and approved before execution.

## Version rule
Golden Path v1.0 remains the ecosystem baseline until a later version is explicitly approved and recorded.
