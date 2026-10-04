# MercySoul Project Template v1.1

Security and approval layer for the MercySoul Golden Path.

Baseline architecture:
VISION BRAIN → GITHUB → VERCEL → SUPABASE

Security path:
GITHUB → SECURITY / REVIEW / APPROVAL → VERCEL → SUPABASE → VERIFY → RECORD

## Required controls
- Pull requests for consequential changes.
- Protected default branch/ruleset.
- Required CI checks.
- CodeQL.
- Dependency review.
- Secret scanning/push protection where supported.
- Production-sensitive approval.
- Post-deployment verification and audit recording.

Run:

    node scripts/verify-golden-path.mjs

No approval = no consequential execution.
