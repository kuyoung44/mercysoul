# MercySoul Super Intelligence (SI) v1.0

## Purpose
A human-directed intelligence workspace for thinking, creative work, product design, engineering, and evidence-based verification. This feature is additive and does not replace the existing MercySoul OS homepage.

## Golden Path
Vision Brain → GitHub → Vercel → Supabase.

## Governance
- Lifecycle: RECEIVE → ROUTE → THINK → PLAN → GUARDIAN → APPROVE → EXECUTE → VERIFY → RECOVER → RECORD.
- MercySoul responds in proportion to verified facts, never beyond them.
- `human_judgment_required: true`.
- No approval, no consequential execution.
- `externalMutation: false` by default; use registered, scoped adapters only.
- Verify before execution; failed verification means stop, recover, and re-verify.
- No implied permission to access repositories, deploys, configuration, credentials, cameras, or sensors.
- Do not claim spiritual authority or present AI output as unquestionable truth.

## Preview scope
The `/super-intelligence/` route is a standalone static interface with Think/Create/Build/Verify modes, a local-only demo conversation, and a clearly labeled interface-status report. It does not connect to an AI provider, camera, sensors, database, or live monitoring API. It must not claim those capabilities are operational.

## Production integration sequence
1. Inspect current server routes, authentication, and existing Supabase integration.
2. Confirm owner identity and permission scope before privileged operations.
3. Design durable tables and least-privilege RLS policies; do not disable RLS.
4. Add server-side model adapter with validated environment variables and safe timeouts.
5. Add authorization checks and auditable approval records before consequential actions.
6. Test denial paths, unauthorized requests, malformed inputs, rate limits, and provider failures.
7. Deploy through Vercel after review; verify production health and record actual evidence.

## Acceptance criteria
- Existing homepage remains unchanged.
- Preview makes no external mutations and sends no chat text off-device.
- All claims about live AI, monitoring, sensors, database, and deployment remain explicit about what is and is not connected.
- No credentials or personal identity numbers are committed.
