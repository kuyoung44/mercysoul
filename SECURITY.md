# MercySoul OS Security Policy

## Security principles

MercySoul OS follows least privilege, defense in depth, explicit authorization, auditability, and safe failure.

## Secrets

- Never commit API keys, payment secrets, service-role keys, passwords, recovery phrases, or private tokens.
- Production secrets belong in GitHub Actions secrets/environment secrets or the hosting provider's secret manager.
- Client-side code must never receive server-only secrets.

## Autonomous actions

Automation is bounded by the Alignment Core.

- **AUTO:** low-risk internal operations such as validation, brief generation, diagnostics, and queued artwork work.
- **CONFIRM:** publishing, refunds, price changes, and production deployment.
- **BLOCK:** destructive customer-data operations, credential changes, disabled authentication, or requests that fail authorization/safety checks.

AI-generated patches must pass CI and must not silently bypass review or security controls.

## Payments

- Payment webhooks must be signature-verified when a production secret is configured.
- Payment events must be idempotent before fulfillment.
- Never fulfill an order solely because a client says it was paid.

## Customer data

Collect only information needed to provide the service. Avoid logging secrets or unnecessary personal information. Access to production customer data must be restricted to authorized services and operators.

## AI/image generation

Creation requires a verified creative brief and paid order. Unsafe or disallowed requests must be rejected or routed for review. Provider failures must never be represented as successful generation.

## CI/CD

Every change should pass build and tests. Diagnostics and reports are retained as workflow artifacts. Security fixes should be applied through auditable commits/PRs rather than uncontrolled self-modification.

## Vulnerability reporting

Please report suspected vulnerabilities privately to the repository owner rather than publicly disclosing exploitable details. Include a concise description, affected component, reproduction steps, and potential impact.

## Incident response

1. Stop or restrict the affected automation.
2. Preserve relevant logs and evidence.
3. Rotate compromised credentials.
4. Patch and test the affected component.
5. Verify recovery before restoring automation.
6. Record the incident and prevention measure.
