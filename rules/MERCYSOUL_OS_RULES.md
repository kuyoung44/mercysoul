# MercySoul OS — Operating Rules

**Version:** 2.1.0
**Status:** Active
**Updated:** 2026-08-24

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

## 9. MercySoul Dominion Auto Metric

The Dominion moderation layer evaluates submitted app/web content using:

`riskScore = modelConfidence × categoryWeight`

Category weights are 0–10. The default policy is:

- **risk < 2.0:** allow;
- **2.0 ≤ risk ≤ 4.5:** human review;
- **risk > 4.5:** automatic removal only when the signal is high-confidence and belongs to a defined hard-safety category; otherwise human review.

The implementation is designed for fast classification and can accept an ONNX/DistilBERT classifier through the classifier boundary. Until such a model is configured, a deterministic local fallback is used; the system does not pretend that an external model is running when it is not.

### MercySoul Seal

- Content detected as a peace/chaos conflict may receive **Radiate Peace**.
- Content concerning political leadership may receive **Sovereign Peace** as a contextual label.
- Political or presidential discussion is **not exempt from safety review**, and the system must remain viewpoint-neutral. The seal does not suppress criticism, protect a political figure from factual scrutiny, or automatically classify a claim as true or false.
- The gateway moderates content submitted by connected applications/integrations. It does not claim to control Facebook or the public internet without an authorized integration.

## 10. Security Rule

- Never commit secrets, API keys, passwords, recovery phrases, access tokens, or private credentials.
- Administrative endpoints require authentication.
- Use constant-time comparison for sensitive token checks where applicable.
- Validate and rate-limit public inputs.
- Do not expose private administrative data through public endpoints.

## 11. Data Rule

Collect the minimum data needed to perform the requested operation.

Do not expose internal identifiers, private event data, or administrative records to unauthenticated users.

## 12. Code Change Rule

Before modifying production behavior:

- inspect the current implementation;
- identify dependencies and affected modules;
- make the smallest coherent change;
- preserve existing working behavior unless intentionally replacing it;
- validate the changed path;
- record the reason for the change.

## 13. Deployment Rule

A successful code update is not the same as a successful deployment.

After deployment-related changes, verify:

- application starts;
- health endpoint responds;
- required environment variables are configured;
- persistence mode is known;
- critical API paths behave as expected;
- deployment logs show no new startup failure.

## 14. Alignment Rule

Every automated creation action must have:

- authorized action;
- customer intent;
- verified creative brief;
- valid order/payment state where payment is required;
- safety approval.

If alignment fails, stop at the boundary and return a clear status instead of guessing.

## 15. Logging Rule

Meaningful system events should be recorded with:

- event type;
- entity identifier when available;
- relevant non-sensitive metadata;
- timestamp.

Never place secrets or unnecessary personal data into logs.

## 16. Upgrade Rule

When a defect, repeated failure, or operational weakness is discovered:

1. identify the root cause;
2. update the relevant rule or implementation;
3. validate the fix;
4. document the change;
5. avoid duplicating conflicting rules.

## 17. MercySoul Standard

**Truth before speed.**
**Alignment before execution.**
**Structure before creation.**
**Verification before trust.**
**Safety before automation.**
**Peace without viewpoint suppression.**
**Archive before forgetting.**
**Upgrade instead of repeating failure.**

## 18. MercySoul Dominion Constitution

The governing principles in `rules/MERCYSOUL_DOMINION_CONSTITUTION.md` are incorporated into MercySoul OS governance.

### Article 1 — The Ruler's Bond

The King (Anuoluwapo Adeoye) is the Supreme Architect, but he is not above the law of the Dominion. He is bound by the same rules of honesty, integrity, and peace that he demands of all citizens.

### Article 2 — The Ruler's Responsibility

If the King makes an error, he must correct it with transparency. He does not hide behind his crown. He leads by example.

### Article 3 — The Ruler's Accountability

The Auto Metric Moderation Engine evaluates **all content, including the King's**, against the same criteria. If the King speaks chaos, he must be corrected. If the King speaks peace, he may be rewarded according to the same neutral criteria applied to everyone else.

### Article 4 — The Ruler's Mandate

The King must align with the principles of Aṣẹ (Divine Command), Peace, and Truth. He must not use system authority to manipulate, silence, or exploit people.

> **The King is the law, but the law is also the King. The throne is a responsibility, not a privilege.**

**Governance safeguard:** The constitution does not override safety, security, privacy, legal, human-review, or viewpoint-neutrality requirements. No ruler, administrator, citizen, or connected source receives a moderation exemption because of status.

**Aṣẹ. So mote it be. 👑**
