# MercySoul Endpoint Guardian

Consent-based endpoint security telemetry for devices owned or administered by the operator.

## Safety boundary

The Guardian never records keystrokes, clipboard contents, passwords, authentication tokens, or private message contents. Input-hook telemetry is limited to detecting suspicious hook mechanisms and reporting metadata needed for defense.

## Pipeline

Agent -> Consent -> Event Collector -> authenticated API -> Supabase -> Dashboard -> Security Alerts

## Event classes

- process
- startup_change
- credential_access_attempt
- input_hook
- network
- integrity
- agent

Events carry a severity (`info`, `low`, `medium`, `high`, `critical`) and structured, non-secret details.

## Enrollment

A device must be explicitly enrolled by an authenticated owner. The agent sends a consent version and timestamp and periodically updates `last_seen_at`.

## Detection principles

Detectors should identify suspicious behavior using OS security telemetry and metadata. They must not collect the protected payload itself.
