# MercyCursor

MercyCursor is the Cursor-style coding layer for MercySoul. It is not a separate authority: it operates inside the MercySoul Command Center and inherits the existing approval, Guardian, provider, and verification boundaries.

## Purpose

Turn natural-language software requests into a controlled coding workflow:

1. Understand the request.
2. Collect repository/file context.
3. Produce a minimal implementation plan.
4. Run MercySoul alignment checks.
5. Pause when a live, production, or destructive write needs approval.
6. Apply changes only through an authorized provider path.
7. Verify build/tests/live behavior.
8. Persist/report the result through the Command Center.

## API

- GET /api/cursor/status — capability and alignment status.
- POST /api/cursor/plan — analyze a coding request and return a plan. Send command or prompt plus optional context.files, selection, repository, and branch.

## Alignment rules

- Read-only analysis is allowed by default.
- File writes are planned explicitly.
- Production/live/main/commit/deploy operations require approval.
- Destructive operations require approval and are never silently executed.
- Secrets must stay in environment/provider configuration, never in generated patches.
- Verification is part of the workflow, not an optional afterthought.
