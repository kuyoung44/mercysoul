# 4/4MS16 language migration plan

## Target outcome

Use MSVB as a common, reviewable intent and policy layer across MercySoul. Add adapters incrementally; do not bulk-rewrite repositories or claim universal replacement.

## Phases

1. **Specify:** approve the grammar, types, policy semantics, error behavior, and versioning.
2. **Parse:** implement a strict parser and test malformed input, duplicate declarations, and unknown directives.
3. **Intermediate representation:** define a stable typed IR and source locations for diagnostics.
4. **Guardian checks:** enforce effects, human approval, secret hygiene, and deny-by-default behavior.
5. **First adapter:** generate a narrow, documented JavaScript/TypeScript subset. Never execute generated code during conversion.
6. **Conformance tests:** run source/target behavior comparisons, negative tests, and security tests.
7. **Pilot:** choose one non-critical service on a feature branch; retain the original implementation until a human approves replacement.
8. **Expand:** add Python, SQL, or other adapters only with language-specific tests and a clear supported-subset statement.

## Required migration report

Each conversion must record:
- source files and source language/version;
- converter version and target language/version;
- translated constructs;
- unsupported constructs and manual-review items;
- test commands and observed results;
- security/policy findings;
- reviewer and approval status;
- rollback path.

## Non-negotiable gates

- No production rewrite by assumption.
- No deployment or external mutation without authorization.
- No secrets in generated code, logs, or test fixtures.
- No silent behavior changes.
- No claiming a target is verified without actual test evidence.
- Keep human judgment required for consequential actions.
