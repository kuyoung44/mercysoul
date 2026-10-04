# MercySoul Golden Path v1.1 — Security & Approval Layer

Status: PROPOSED STANDARD UPDATE
Effective: 2026-10-04
Baseline: Golden Path v1.0
Owner: MercySoul Dominion Founder

## Purpose
v1.1 adds explicit GitHub security, review, dependency, and approval controls to the sealed Golden Path v1.0 architecture.

## Canonical flow
VISION BRAIN → GITHUB → SECURITY / REVIEW / APPROVAL → VERCEL → SUPABASE → VERIFY → RECORD

## Required controls
1. Pull requests for consequential code changes.
2. Protected default branch through repository rules/rulesets.
3. Required CI checks before merge.
4. CodeQL analysis for supported code.
5. Dependency review on pull requests.
6. Secret scanning and push protection enabled where supported by the GitHub plan/repository settings.
7. Required review/approval for production-sensitive changes.
8. Deployment verification after Vercel release.
9. Durable audit recording where the operation requires it.

## Approval rule
No approval = no consequential execution.

Automation may validate, report, prepare, and propose. It must not silently bypass required human approval or repository protection.

## Verification rule
A green workflow is evidence of the checks that actually ran. It is not permission to bypass deployment, security, or approval controls.

## Recovery
Failed verification moves the operation into RECOVER. Rollback/revert must be deliberate, least-intrusive, and recorded.

## Audit
Record:
- actor
- repository
- commit/PR
- requested action
- approval evidence
- execution result
- verification result
- recovery action when applicable

## Version rule
v1.1 is a versioned security-layer proposal on top of sealed v1.0. It does not silently replace v1.0. Promotion to the active baseline requires explicit approval and a recorded merge.
