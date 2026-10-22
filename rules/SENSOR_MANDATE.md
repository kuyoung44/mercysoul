# MercySoul SI Sensor Mandate v1.0

Status: governance requirement and adapter contract. This document does not itself grant hardware access or prove that a sensor is connected.

## Invariant

**OBSERVE → VERIFY → PROTECT → AUTHORIZE → USE → VERIFY RESULT → RECORD**

MercySoul may observe only data exposed by an installed, supported adapter and authorized for the stated purpose. Unknown, stale, missing, contradictory, or unverifiable sensor signals are not facts.

## Cross-layer requirements

1. **Interface:** show each sensor's capability, adapter/connection state, permission/consent state, last successful check, data freshness, and errors. Offer a results view that distinguishes facts, inferences, unavailable data, and uncertainty.
2. **Adapter:** access hardware or provider data only through a documented adapter. Do not simulate readings or report a sensor as active because a UI control exists.
3. **Identity and authorization:** authenticate the requesting principal; check role, tenant, resource, purpose, scope, consent, and current platform permission. A project identity or admin role is not a privacy bypass.
4. **Guardian:** fail closed on missing authorization, denied/revoked permission, unsupported capability, scope mismatch, stale signal, or policy uncertainty. Do not infer consent from silence.
5. **Intelligence:** attach provenance and observation time to readings. Label inference separately from measurement; never turn an allegation or model prediction into a verified observation.
6. **Execution:** observation does not authorize external mutation. Consequential actions require a separate explicit approval and authorization check.
7. **Persistence:** store minimum necessary metadata for audit. Do not persist raw audio, video, location, biometric, or other sensitive sensor payloads by default. Define retention and deletion rules before enabling storage.
8. **Audit:** record access decisions, purpose/scope, adapter, permission state, timestamps, outcome, and safe error codes. Never log credentials or raw sensitive payloads.
9. **Verification:** test allow/deny paths, consent revocation, permission denial, stale data, adapter timeout/error, tenant isolation, and audit failure. A failed required audit or authorization check blocks access.
10. **Operations and deployment:** validate configuration and adapter health separately in development, preview, and production. Do not claim end-to-end monitoring until integration and deployment are independently verified.
11. **Human judgment:** high-impact interpretations and consequential actions require a human decision-maker. Sensor evidence supports judgment; it does not replace it.
12. **Privacy and safety:** use least privilege, visible status, purpose limitation, data minimization, and a user-accessible stop/revoke path. No covert recording or permission bypass.

## Initial sensor categories

- Camera and microphone: device permission plus clear, purpose-specific user consent; off unless actively requested and authorized.
- Location: precise purpose and consent; coarse location only when sufficient.
- Device/application health: collect only documented diagnostics needed for service integrity.
- Network/integration events: inspect only traffic and events the service is authorized to process.
- External provider signals: preserve provider provenance, timestamps, and error states; do not imply control over third-party systems.

## Required result fields

Every adapter result should provide, where applicable:

`sensorType`, `adapterId`, `status`, `observedAt`, `freshUntil`, `permissionState`, `consentState`, `purpose`, `scope`, `provenance`, `dataClassification`, and a safe `errorCode`.

Valid status labels include `available`, `unavailable`, `denied`, `stale`, `error`, and `not_configured`. Never use `active` unless an installed adapter has verified that state.

## Release gate

No sensor integration is production-ready until the adapter is implemented, permissions are enforced server-side where applicable, audit/retention behavior is defined, tests pass, and deployment behavior is verified. This mandate is a policy contract, not a claim that camera, microphone, or device sensors are currently connected.
