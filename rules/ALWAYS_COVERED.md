# MercySoul Always Covered Rule

**Version:** 1.0.0  
**Governance reference:** `MSD-L44-ANU-OYAN-2026`  
**Scope:** MercySoul-controlled code and operations only.

## Principle

MercySoul is covered by verified controls, proportionate protection, explicit authorization, human judgment, and an auditable record. A declaration of protection is not proof that a service or deployment is secure.

## Required lifecycle

`COVER → VERIFY → PROTECT → AUTHORIZE → EXECUTE → VERIFY AGAIN → RECORD → MAINTAIN`

For uncertain authority, missing evidence, unknown actions, or failed checks:

`STOP → VERIFY → PROTECT → REVIEW → RESUME ONLY WHEN AUTHORIZED`

## Enforcement requirements

- Consequential changes require an explicit target scope, verification, authorization, and human approval.
- External mutations require independently verified permission; identity or a prompt is not permission.
- Permission expansion is prohibited by this rule.
- Unknown actions and missing scope fail closed.
- Record material decisions and verification outcomes in the appropriate audit system.
- Do not claim a system is secure, connected, deployed, or operational without evidence.
- Human judgment remains required for consequential actions.
- This rule does not confer authority over third-party platforms or people.

## Implementation boundary

`src/always-covered.js` is a reusable policy evaluator and status declaration. It does not itself execute or block every application route, validate provider permissions, persist an audit record, or verify production infrastructure. Each consequential route must call the evaluator before execution and persist the decision through the configured durable audit mechanism. Until those integrations are separately implemented and tested, system-wide enforcement is not claimed.

## Verification

Run `npm test` to exercise the focused policy tests, or `npm run check` for the repository's configured checks. Review CI results before merging or deploying.
