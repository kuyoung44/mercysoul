# MercySoul Network Guardian — Device Trace Before Action Mode v1.0

## Scope
A monitor-only assessment layer for telemetry explicitly supplied by an operator who confirms the data comes from an environment they own or are authorized to administer. This initial version does not discover devices, probe IP addresses, collect data from a device, or connect to a network provider.

## API
- `GET /api/guardian/trace/status`: reports version and monitor-only guardrails.
- `POST /api/guardian/trace`: accepts a JSON object with `authorizedScopeConfirmed: true` and optional `devices` array (maximum 100 records). Each record may include `recordId`, `label`, `source`, `observedAt`, `evidenceVerified`, `signals`, `trafficSpike`, and `connectionSpike`.

The API returns review classifications, not a claim that a device is malicious. A device label or network address is not proof of identity or wrongdoing. Do not include passwords, tokens, private keys, or unnecessary personal data in telemetry.

## Required operating sequence
`OBSERVE → VERIFY → ASSESS → PROTECT WITH AUTHORIZATION → TEST → RECORD`

1. Establish ownership/administrative authority and exact scope.
2. Verify timestamp, telemetry provenance, baselines, and corroborating evidence.
3. Treat unverified indicators as unverified; never infer intent from an IP or device name alone.
4. Keep this version in monitor-only mode. Rate limiting, isolation, blocking, or configuration changes require a separately implemented, scoped integration and explicit human approval.
5. After any separately approved change, verify service recovery and preserve an audit record.

## Safety properties
- No network scanning or device takeover.
- No automatic blocking or external mutation.
- No provider calls or persistent storage in this module.
- Maximum 100 device records, 12 signals per record, and bounded string fields.
- Human judgment and explicit approval remain required for consequential action.

## Tests
Run `node --test src/network-guardian.test.js`. The existing project test suite should also be run before merging.
