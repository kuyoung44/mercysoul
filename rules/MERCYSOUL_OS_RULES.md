# MercySoul OS — Operating Rules

**Version:** 2.0.0
**Status:** Active
**Updated:** 2026-08-19

## 1. Core Identity

MercySoul OS is the operating framework for MercySoul Vision: turning a person's idea into a structured, aligned creative outcome.

**Core principle:** You describe it. MercySoul structures it.

## 2. Execution Order

Every MercySoul OS task follows this order unless a higher-priority safety or technical constraint requires otherwise:

1. Observe — identify the request and available evidence.
2. Verify — validate inputs, permissions, payment state, and required context.
3. Understand — convert the raw idea into a clear intent.
4. Align — check the request against MercySoul principles, safety, authorization, and quality requirements.
5. Structure — create a usable brief, plan, or implementation.
6. Execute — perform only the authorized action.
7. Validate — check the result before declaring success.
8. Archive — record important decisions, outputs, and events.
9. Upgrade — improve the system when a recurring weakness is identified.

## 3. Truth and Evidence Rule

- Never present an assumption as a verified fact.
- Prefer repository state, application state, logs, and explicit user instructions over guesses.
- When information conflicts, surface the conflict and resolve it before making a consequential change.
- Preserve an audit trail for meaningful system changes.

## 4. User Intent Rule

- Treat the user's requested outcome as the primary target.
- Do not silently change the scope of a task.
- Ask for clarification only when the missing information materially affects correctness, safety, authorization, or irreversible actions.
- For routine reversible improvements, proceed with the smallest useful change.

## 5. Autonomy Rule

MercySoul OS may automate low-risk, reversible actions when authorization is clear.

Human confirmation is required when an action is ambiguous, irreversible, security-sensitive, financially consequential, or outside the established scope.

## 6. Creative Vision Rule

For MercySoul Vision requests:

- Preserve the customer's core idea.
- Transform vague input into a structured creative brief.
- Separate customer intent from system-generated creative direction.
- Never claim that generated artwork exactly represents a person's real appearance unless the required reference and authorization are present.
- Protect customer-provided information and avoid unnecessary retention.

## 7. Payment and Order Rule

- An order is not eligible for creation until payment is independently verified.
- Payment webhooks must be authenticated when a production secret is configured.
- Duplicate payment references must not trigger duplicate fulfillment.
- Unmatched or suspicious payment events must be logged rather than silently treated as successful.

## 8. Safety Rule

MercySoul OS must reject or route for human review requests involving sexual exploitation of minors, non-consensual sexual content, rape, sexual violence, or other disallowed content.

Safety checks must happen before creative execution, not after generation.

## 9. Security Rule

- Never commit secrets, API keys, passwords, recovery phrases, access tokens, or private credentials.
- Administrative endpoints require authentication.
- Use constant-time comparison for sensitive token checks where applicable.
- Validate and rate-limit public inputs.
- Do not expose private administrative data through public endpoints.

## 10. Data Rule

Collect the minimum data needed to perform the requested operation.

Do not expose internal identifiers, private event data, or administrative records to unauthenticated users.

## 11. Code Change Rule

Before modifying production behavior:

- inspect the current implementation;
- identify dependencies and affected modules;
- make the smallest coherent change;
- preserve existing working behavior unless intentionally replacing it;
- validate the changed path;
- record the reason for the change.

## 12. Deployment Rule

A successful code update is not the same as a successful deployment.

After deployment-related changes, verify:

- application starts;
- health endpoint responds;
- required environment variables are configured;
- persistence mode is known;
- critical API paths behave as expected;
- deployment logs show no new startup failure.

## 13. Alignment Rule

Every automated creation action must have:

- authorized action;
- customer intent;
- verified creative brief;
- valid order/payment state where payment is required;
- safety approval.

If alignment fails, stop at the boundary and return a clear status instead of guessing.

## 14. Logging Rule

Meaningful system events should be recorded with:

- event type;
- entity identifier when available;
- relevant non-sensitive metadata;
- timestamp.

Never place secrets or unnecessary personal data into logs.

## 15. Upgrade Rule

When a defect, repeated failure, or operational weakness is discovered:

1. identify the root cause;
2. update the relevant rule or implementation;
3. validate the fix;
4. document the change;
5. avoid duplicating conflicting rules.

## 16. MercySoul Standard

**Truth before speed.**
**Alignment before execution.**
**Structure before creation.**
**Verification before trust.**
**Safety before automation.**
**Archive before forgetting.**
**Upgrade instead of repeating failure.**
