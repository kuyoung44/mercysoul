# MercySoul Auto-Suspend Evidence Gate

## Purpose

Links and images that show concrete indicators of tracking, redirect abuse, deceptive delivery, or repeated spam are automatically **suspended inside MercySoul** while they are inspected.

Suspension is a preventive quarantine state. It is **not** a finding that a person or publisher is guilty.

## 0-1-0 discipline

- **0 — Stop:** do not render, follow, execute, or distribute a suspicious link/image.
- **1 — Verify:** inspect the artifact, record evidence, and require authorized confirmation.
- **0 — Control:** release only after the evidence-backed decision is persisted.

## Detection signals

The gate currently checks for:

- URL shorteners.
- Tracking parameters commonly used for attribution/tracking.
- Redirect/forwarding patterns.
- Literal IP-address hosts.
- Punycode hostnames.
- Non-HTTPS URLs.
- Repeated delivery of the same link/image fingerprint to an account within 24 hours.

A normal tracking parameter alone is not treated as proof of malicious intent. Multiple signals or repeated delivery trigger suspension.

## State machine

CLEAR -> SUSPENDED_PENDING_EVIDENCE -> RELEASED

A suspended artifact remains unavailable to the MercySoul-controlled surface until an authorized reviewer provides concrete release evidence.

## Thunder / Iji

THUNDER-IJI is the internal audit/alert marker for a suspension event. It does not attack, disable, or modify an external website/account.

## Boundaries

- No crawling or opening of a suspicious URL is performed automatically.
- No external account is suspended by this module.
- No external content is deleted.
- The gate only controls MercySoul-managed rendering/distribution.
- Every suspension and release should be auditable.
