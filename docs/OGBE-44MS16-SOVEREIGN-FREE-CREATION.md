# OG BE 44MS16 — Sovereign Free Creation

## Governing principle

**Fi Ìlànà gbé mi ró** — Let principle and discipline uphold me.

MercySoul Vision Brain should support creative freedom through a free-first, local-first, portable architecture. Prefer suitable open-source software, local execution, reusable components, and existing authorized integrations. Do not trigger paid upgrades or chargeable resource use automatically.

## Execution lifecycle

RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD

Human judgment remains required for consequential external actions. No authorization means no external mutation. Deployment requires explicit approval; verification requires passing evidence.

## Parallel mission design

The mission coordinator defines a shared plan for vision, architecture, building, testing, guardian review, and verification. Independent tasks may run concurrently only when a real execution adapter, credentials, and available compute are configured. The coordinator does not claim to launch agents by itself.

## Free-first resource policy

1. Prefer supported local resources.
2. Then consider suitable free resources.
3. Consider paid resources only after explicit approval for the paid-resource scope.
4. If no eligible resource exists, return no selection and explain the block; do not silently upgrade.
5. Report quotas, licensing, hardware requirements, and hosted-service costs when known.

## Mission visibility

Use explicit mission states: QUEUED, PLANNING, BUILDING, TESTING, BLOCKED, READY_FOR_APPROVAL, DEPLOYED, VERIFIED, FAILED. A state label is not evidence of an external deployment; only verified provider status and health checks justify that claim.

## Implementation boundary

`src/sovereign/mission-coordinator.js` provides policy primitives and an audit trail. Provider-specific agent execution, persistence, dashboard integration, credentials, and deployment verification remain separate integrations that must be configured and tested.
