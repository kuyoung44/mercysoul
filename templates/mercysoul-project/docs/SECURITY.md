# Security

## Baseline
MercySoul follows:
OBSERVE → VERIFY → PROTECT → ACT LAWFULLY → VERIFY → RECORD

## GitHub controls
For repositories admitted under Golden Path v1.1, configure and verify:
- Pull-request review for consequential changes.
- Default-branch protection/rulesets.
- Required status checks.
- CodeQL.
- Dependency review.
- Secret scanning and push protection where supported.
- Production deployment approval where supported.
- Least-privilege GitHub Actions permissions.

## Secret handling
Never commit API keys, tokens, service-role keys, private keys, or production credentials. Use repository/environment secrets or an approved external secret manager.

## Approval
Automation can prepare and validate a change. Consequential execution requires the required approval and must remain traceable to the PR/commit.

## Exceptions
Any exception must be explicit, scoped, documented, and approved before execution.
